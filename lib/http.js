function send(res, code, obj) {
  res.statusCode = code;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(obj));
}

async function readJSON(req) {
  if (req.body !== undefined && req.body !== null && req.body !== "") {
    if (Buffer.isBuffer(req.body)) return JSON.parse(req.body.toString("utf8"));
    return typeof req.body === "string" ? JSON.parse(req.body) : req.body;
  }
  const chunks = [];
  for await (const c of req) chunks.push(c);
  const txt = Buffer.concat(chunks).toString("utf8");
  return txt ? JSON.parse(txt) : null;
}

module.exports = { send, readJSON };
