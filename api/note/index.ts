import type { VercelRequest, VercelResponse } from "@vercel/node";
import { Octokit } from "@octokit/rest";

const auth = process.env.GITHUB_TOKEN;
const octokit = new Octokit({ auth });

module.exports = async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  const { data } = await octokit.request("/user");
  res.status(200).json({ data });
};
