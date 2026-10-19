const { send } = require("../lib/http");
const { isAuthed } = require("../lib/auth");
const { vapid } = require("../lib/push");

module.exports = async (req, res) => {
  if (!isAuthed(req)) return send(res, 401, { error: "login" });
  try {
    const v = await vapid();
    send(res, 200, { mode: "cloud", vapidPublicKey: v.publicKey });
  } catch (e) {
    send(res, 200, { mode: "cloud", error: e.message });
  }
};
