// Date "naive" (senza fuso): le task usano l'ora locale di chi le scrive, come sul Mac.
const pad = (n) => String(n).padStart(2, "0");
const utc = (ymd) => { const [y, m, d] = ymd.split("-").map(Number); return Date.UTC(y, m - 1, d); };
const naive = (s) => { const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(s || ""); return m ? Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]) : NaN; };
const ymdOf = (ts) => { const d = new Date(ts); return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`; };

function nowNaive(tz, date = new Date()) {
  const p = {};
  new Intl.DateTimeFormat("en-GB", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" })
    .formatToParts(date).forEach((x) => { p[x.type] = x.value; });
  return Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute);
}

// La task cade nel giorno ymd? (stessa logica della versione per Mac)
function occurs(t, ymd) {
  const n = +t.repeat_n || 0;
  if (!(n > 0)) return t.date === ymd;
  if (!t.date || ymd < t.date) return false;
  const a = new Date(utc(t.date)), b = new Date(utc(ymd));
  if (t.repeat_unit === "mesi") {
    const m = (b.getUTCFullYear() - a.getUTCFullYear()) * 12 + b.getUTCMonth() - a.getUTCMonth();
    if (m % n) return false;
    const dim = new Date(Date.UTC(b.getUTCFullYear(), b.getUTCMonth() + 1, 0)).getUTCDate();
    return b.getUTCDate() === Math.min(a.getUTCDate(), dim);
  }
  return Math.round((b - a) / 864e5) % (n * (t.repeat_unit === "settimane" ? 7 : 1)) === 0;
}

const isDone = (t, ymd) => ((+t.repeat_n || 0) > 0 ? (t.done_dates || []).includes(ymd) : !!t.done);

// Notifiche da inviare ora: scadute da meno di 24 ore e non ancora inviate.
function dueNotifications(tasks, nowTs, sent) {
  const out = [], today = utc(ymdOf(nowTs));
  for (const t of tasks) {
    if (!t || t.kind === "link" || !t.notify || !t.notify_at || !t.date) continue;
    const delta = naive(t.notify_at) - utc(t.date);
    if (!Number.isFinite(delta)) continue;
    for (let off = -10; off <= 10; off++) {
      const ymd = ymdOf(today + off * 864e5);
      if (!occurs(t, ymd) || isDone(t, ymd)) continue;
      const at = utc(ymd) + delta;
      const key = `${t.id}|${ymd}|${t.notify_at}`;
      if (at <= nowTs && at >= nowTs - 864e5 && !sent.has(key)) out.push({ task: t, key, ymd });
    }
  }
  return out;
}

module.exports = { nowNaive, occurs, isDone, dueNotifications, ymdOf, utc, naive };
