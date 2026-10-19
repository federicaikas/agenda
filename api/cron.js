// Chiamata ogni minuto da un servizio esterno (vedi README): invia le notifiche scadute.
const { send } = require("../lib/http");
const { safeEq } = require("../lib/auth");
const { getJSON, setJSON } = require("../lib/store");
const { nowNaive, dueNotifications, ymdOf } = require("../lib/schedule");
const { sendAll } = require("../lib/push");

module.exports = async (req, res) => {
  const secret = process.env.CRON_SECRET;
  if (!secret) return send(res, 503, { error: "Manca CRON_SECRET nelle impostazioni di Vercel" });
  const given = String(req.headers.authorization || "").replace(/^Bearer\s+/i, "") ||
    (new URL(req.url, "http://x").searchParams.get("key") || "");
  if (!safeEq(given, secret)) return send(res, 401, { error: "chiave non valida" });
  try {
    const tasks = await getJSON("agenda:tasks", []);
    const sentList = await getJSON("agenda:sent", []);
    const sent = new Set(sentList);
    const nowTs = nowNaive(process.env.TZ_NAME || "Europe/Rome");
    const due = dueNotifications(tasks, nowTs, sent);
    let fired = 0;
    for (const d of due) {
      const r = await sendAll({ title: d.task.title || "Task", body: (d.task.description || "").slice(0, 120) || "Promemoria" });
      if (r.ok > 0) { sent.add(d.key); fired++; }
    }
    // pulizia: tieni solo le voci recenti di task ancora esistenti
    const ids = new Set(tasks.map((t) => t && t.id));
    const cutoff = ymdOf(nowTs - 60 * 864e5);
    const kept = [...sent].filter((k) => { const [id, ymd] = k.split("|"); return ids.has(id) && ymd >= cutoff; }).slice(-500);
    if (fired || kept.length !== sentList.length) await setJSON("agenda:sent", kept);
    send(res, 200, { checked: tasks.length, due: due.length, fired });
  } catch (e) {
    send(res, 500, { error: e.message });
  }
};
