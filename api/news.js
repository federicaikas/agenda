const { send } = require("../lib/http");
const { isAuthed } = require("../lib/auth");
const { getNews } = require("../lib/news");

module.exports = async (req, res) => {
  if (!isAuthed(req)) return send(res, 401, { error: "login" });
  try {
    send(res, 200, { items: await getNews(String(req.url).includes("fresh=1")) });
  } catch (e) {
    send(res, 200, { error: String(e.message || e).slice(0, 120) });
  }
};
