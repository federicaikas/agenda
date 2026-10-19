const { send, readJSON } = require("../lib/http");
const { isAuthed, sameOrigin } = require("../lib/auth");
const { cmd, getJSON } = require("../lib/store");

module.exports = async (req, res) => {
  if (!isAuthed(req)) return send(res, 401, { error: "login" });
  try {
    if (req.method === "GET") return send(res, 200, await getJSON("agenda:tasks", []));
    if (req.method === "POST") {
      if (!sameOrigin(req)) return send(res, 403, {});
      const body = await readJSON(req);
      if (!Array.isArray(body) || !body.every((x) => x && typeof x === "object")) return send(res, 400, { error: "formato non valido" });
      const text = JSON.stringify(body);
      if (text.length > 800000) return send(res, 413, { error: "troppi dati" });
      const old = await cmd("GET", "agenda:tasks");
      if (old) await cmd("SET", "agenda:tasks:prev", old); // copia di sicurezza dell'ultimo salvataggio
      await cmd("SET", "agenda:tasks", text);
      return send(res, 200, {});
    }
    send(res, 405, {});
  } catch (e) {
    send(res, 500, { error: e.message });
  }
};
