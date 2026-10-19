import calendar, json, os, shutil, subprocess, threading, time, urllib.request
from html.parser import HTMLParser
from urllib.parse import urljoin
from datetime import date, datetime, timedelta
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

PORT = 8765
BASE = os.path.dirname(os.path.abspath(__file__))
DATA = os.path.join(BASE, "tasks.json")
BK = os.path.join(BASE, "backup")
lock = threading.Lock()
INDEX = os.path.join(BASE, "index.html")
if not os.path.exists(INDEX):  # eseguito dal progetto GitHub: la pagina sta in public/
    INDEX = os.path.join(BASE, "public", "index.html")


def load():
    try:
        with open(DATA, encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return []


def save(tasks):
    tmp = DATA + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(tasks, f, ensure_ascii=False, indent=1)
    os.replace(tmp, DATA)


def occurs(t, d):
    try:
        n = int(t.get("repeat_n") or 0)
        a = date.fromisoformat(t["date"])
    except Exception:
        return False
    if n <= 0:
        return d == a
    if d < a:
        return False
    if t.get("repeat_unit") == "mesi":
        m = (d.year - a.year) * 12 + d.month - a.month
        return m % n == 0 and d.day == min(a.day, calendar.monthrange(d.year, d.month)[1])
    return (d - a).days % (n * (7 if t.get("repeat_unit") == "settimane" else 1)) == 0


NEWS_URL = "https://www.teleboario.it/"
UA = "Mozilla/5.0 (Macintosh) AgendaLocale"
_news = {"t": 0, "items": []}


class _Ticker(HTMLParser):
    """Legge la fascia 'Ultime news' della home di Teleboario."""

    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.depth, self.href, self.buf, self.items = 0, None, [], []

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if self.depth:
            if tag == "div":
                self.depth += 1
            elif tag == "a":
                self.href, self.buf = a.get("href"), []
        elif tag == "div" and "ticker-track" in (a.get("class") or ""):
            self.depth = 1

    def handle_endtag(self, tag):
        if not self.depth:
            return
        if tag == "a" and self.href is not None:
            title = " ".join("".join(self.buf).split())
            if title and self.href:
                self.items.append((title, self.href))
            self.href = None
        elif tag == "div":
            self.depth -= 1

    def handle_data(self, d):
        if self.depth and self.href is not None:
            self.buf.append(d)


def fetch_html():
    req = urllib.request.Request(NEWS_URL, headers={"User-Agent": UA})
    try:
        with urllib.request.urlopen(req, timeout=12) as r:
            return r.read().decode("utf-8", "replace")
    except Exception as err:
        out = subprocess.run(["curl", "-sL", "-m", "15", "-A", UA, NEWS_URL], capture_output=True, timeout=20)
        if out.returncode != 0 or not out.stdout:
            raise err
        return out.stdout.decode("utf-8", "replace")


def get_news():
    if time.time() - _news["t"] < 10 and _news["items"]:
        return _news["items"]
    p = _Ticker()
    p.feed(fetch_html())
    seen, items = set(), []
    for title, href in p.items:
        url = urljoin(NEWS_URL, href)
        if url in seen or not url.startswith("https://www.teleboario.it/"):
            continue
        seen.add(url)
        items.append({"title": title, "url": url})
    if not items:
        raise ValueError("elenco notizie non trovato nella pagina")
    _news["t"], _news["items"] = time.time(), items[:5]
    return _news["items"]


def notify(title, text):
    esc = lambda s: s.replace("\\", "\\\\").replace('"', '\\"')
    script = f'display notification "{esc(text)}" with title "{esc(title)}" sound name "Glass"'
    try:
        subprocess.run(["osascript", "-e", script], timeout=10)
    except Exception:
        pass


def background():
    last_backup = None
    while True:
        now = datetime.now().strftime("%Y-%m-%dT%H:%M")
        with lock:
            tasks, changed = load(), False
            now_dt = datetime.now()
            for t in tasks:
                if not (t.get("notify") and t.get("notify_at")):
                    continue
                text = (t.get("description") or "")[:120] or "Promemoria"
                try:
                    delta = datetime.strptime(t["notify_at"], "%Y-%m-%dT%H:%M") - datetime.combine(date.fromisoformat(t["date"]), datetime.min.time())
                    repeating = int(t.get("repeat_n") or 0) > 0
                except Exception:
                    continue
                if repeating:
                    nd = t.get("notified_dates") or []
                    for off in range(-8, 9):
                        d = now_dt.date() + timedelta(days=off)
                        k = d.isoformat()
                        if not occurs(t, d) or k in nd or k in (t.get("done_dates") or []):
                            continue
                        if k == t["date"] and t.get("notified"):
                            continue
                        nat = datetime.combine(d, datetime.min.time()) + delta
                        if now_dt - timedelta(days=1) <= nat <= now_dt:
                            notify(t.get("title") or "Task", text)
                            nd.append(k)
                            t["notified_dates"], changed = nd, True
                elif (not t.get("done") and not t.get("notified") and t["notify_at"] <= now):
                    notify(t.get("title") or "Task", text)
                    t["notified"], changed = True, True
            if changed:
                save(tasks)
            day = now[:10]
            if day != last_backup and os.path.exists(DATA):
                os.makedirs(BK, exist_ok=True)
                shutil.copy(DATA, os.path.join(BK, f"tasks-{day}.json"))
                last_backup = day
        time.sleep(20)


class Handler(BaseHTTPRequestHandler):
    def log_message(self, *a):
        pass

    def reply(self, body, ctype="application/json", code=200):
        if isinstance(body, str):
            body = body.encode()
        self.send_response(code)
        self.send_header("Content-Type", ctype + "; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        if self.path == "/api/tasks":
            with lock:
                self.reply(json.dumps(load()))
        elif self.path.startswith("/api/news"):
            try:
                if "fresh=1" in self.path:
                    _news["t"] = 0
                self.reply(json.dumps({"items": get_news()}))
            except Exception as err:
                self.reply(json.dumps({"error": str(err)[:120]}))
        else:
            with open(INDEX, "rb") as f:
                self.reply(f.read(), "text/html")

    def do_POST(self):
        origin = self.headers.get("Origin")
        if origin and origin not in (f"http://localhost:{PORT}", f"http://127.0.0.1:{PORT}"):
            return self.reply("{}", code=403)
        raw = self.rfile.read(int(self.headers.get("Content-Length", 0)))
        if self.path == "/api/test":
            notify("Agenda", "Le notifiche funzionano!")
            return self.reply("{}")
        new = json.loads(raw)
        with lock:
            old = {t.get("id"): t for t in load()}
            for t in new:
                o = old.get(t.get("id"))
                if o and o.get("notify_at") == t.get("notify_at"):
                    if o.get("notified"):
                        t["notified"] = True
                    nd = set(o.get("notified_dates") or []) | set(t.get("notified_dates") or [])
                    if nd:
                        t["notified_dates"] = sorted(nd)
            save(new)
        self.reply("{}")


if __name__ == "__main__":
    threading.Thread(target=background, daemon=True).start()
    ThreadingHTTPServer(("127.0.0.1", PORT), Handler).serve_forever()
