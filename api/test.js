const { send } = require("../lib/http");
const { isAuthed, sameOrigin } = require("../lib/auth");
const { sendAll } = require("../lib/push");

module.exports = async (req, res) => {
  if (!isAuthed(req)) return send(res, 401, { error: "login" });
  if (req.method !== "POST") return send(res, 405, {});
  if (!sameOrigin(req)) return send(res, 403, {});
  try {
    const r = await sendAll({ title: "Agenda", body: "Le notifiche funzionano!" });
    if (!r.total) return send(res, 200, { error: "Nessun dispositivo registrato: premi prima «Attiva notifiche»" });
    if (!r.ok) return send(res, 200, { error: "Invio non riuscito: riattiva le notifiche su questo browser" });
    send(res, 200, { ok: true });
  } catch (e) {
    send(res, 200, { error: e.message });
  }
};
