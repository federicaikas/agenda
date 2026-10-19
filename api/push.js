const { send, readJSON } = require("../lib/http");
const { isAuthed, sameOrigin } = require("../lib/auth");
const { addSubscription } = require("../lib/push");

module.exports = async (req, res) => {
  if (!isAuthed(req)) return send(res, 401, { error: "login" });
  if (req.method !== "POST") return send(res, 405, {});
  if (!sameOrigin(req)) return send(res, 403, {});
  try {
    await addSubscription(await readJSON(req));
    send(res, 200, { ok: true });
  } catch (e) {
    send(res, 400, { error: e.message });
  }
};
