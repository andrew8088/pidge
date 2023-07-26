import type { VercelRequest, VercelResponse } from "@vercel/node";

module.exports = function handler(req: VercelRequest, res: VercelResponse) {
  console.log(req.method, req.url);
  res.status(200).json({ body: "hello world" });
};
