// Legge la fascia «Ultime news» della home di teleboario.it (le 5 notizie in evidenza).
const SITE = "https://www.teleboario.it/";
const NAMED = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", rsquo: "’", lsquo: "‘", ldquo: "“", rdquo: "”", hellip: "…", ndash: "–", mdash: "—" };

function decode(s) {
  return s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e) => {
    if (e[0] === "#") {
      const n = e[1].toLowerCase() === "x" ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
      try { return String.fromCodePoint(n); } catch { return m; }
    }
    const v = NAMED[e.toLowerCase()];
    return v === undefined ? m : v;
  });
}

function tickerBlock(html) {
  const m = /<div\b[^>]*class\s*=\s*["'][^"']*\bticker-track\b[^"']*["'][^>]*>/i.exec(html);
  if (!m) return "";
  const start = m.index + m[0].length;
  const re = /<(\/?)div\b[^>]*>/gi;
  re.lastIndex = start;
  let depth = 1, x;
  while ((x = re.exec(html))) {
    depth += x[1] ? -1 : 1;
    if (depth === 0) return html.slice(start, x.index);
  }
  return html.slice(start);
}

function parseTicker(html) {
  const block = tickerBlock(html), items = [], seen = new Set();
  const re = /<a\b([^>]*)>([\s\S]*?)<\/a>/gi;
  let m;
  while ((m = re.exec(block))) {
    const h = /href\s*=\s*["']([^"']+)["']/i.exec(m[1]);
    if (!h) continue;
    const title = decode(m[2].replace(/<[^>]*>/g, "")).replace(/\s+/g, " ").trim();
    let url;
    try { url = new URL(decode(h[1]), SITE).href; } catch { continue; }
    if (!title || !url.startsWith(SITE) || seen.has(url)) continue;
    seen.add(url);
    items.push({ title, url });
  }
  return items.slice(0, 5);
}

let cache = { t: 0, items: [] };

async function getNews(fresh) {
  if (!fresh && Date.now() - cache.t < 10000 && cache.items.length) return cache.items;
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), 12000);
  let html;
  try {
    const r = await fetch(SITE, { headers: { "User-Agent": "Mozilla/5.0 (compatible; AgendaPersonale)" }, signal: ctl.signal });
    if (!r.ok) throw new Error("il sito ha risposto " + r.status);
    html = await r.text();
  } finally { clearTimeout(timer); }
  const items = parseTicker(html);
  if (!items.length) throw new Error("elenco notizie non trovato nella pagina");
  cache = { t: Date.now(), items };
  return items;
}

module.exports = { getNews, parseTicker, decode };
