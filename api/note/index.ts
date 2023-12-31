import type { VercelRequest, VercelResponse } from "@vercel/node";
import { Octokit } from "@octokit/rest";

const ORG = "andrew8088";
const REPO = "shaky.sh";
const PIDGE_TOKEN = process.env.PIDGE_TOKEN;

module.exports = async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  try {
    const { pidgeToken, githubToken, note, dryRun } = req.body;

    invariant(PIDGE_TOKEN, "Must set a PIDGE_TOKEN");
    invariant(pidgeToken, "body must include `pidgeToken`");
    invariant(pidgeToken === PIDGE_TOKEN, "incorrect pidgeToken provided");
    invariant(githubToken, "body must include `githubToken`");
    invariant(note && note.text, "body must include `note.text`");

    note.name = note.name ?? getDatedNoteName();

    const noteContent = formatContent(note);

    if (dryRun && (dryRun === "true" || dryRun === true)) {
      console.log(
        `dry run: ${JSON.stringify({
          pidgeToken,
          githubToken,
          note,
          noteContent,
        })}`
      );
      res.status(200).json({ pidgeToken, githubToken, note, noteContent });
      return;
    }

    const octokit = new Octokit({ auth: githubToken });

    const data = await commitNote(
      octokit,
      `content/notes/${note.name}`,
      noteContent
    );

    res.status(200).json({ commit: data, note, noteContent });
  } catch (error) {
    console.log(error);
    const errorMessage =
      error && typeof error === "object" && "message" in error
        ? error.message
        : error;
    res.status(400).json({ errorMessage });
  }
};

function formatContent(note: { text: string; tags?: string[] }) {
  if (note.tags && note.tags.length > 0) {
    return `---
tags: ${JSON.stringify(note.tags)}
---
${note.text}`;
  }
  return note.text;
}

function invariant(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function pad(num: number) {
  return num.toString().padStart(2, "0");
}

function getDatedNoteName() {
  const now = new Date();
  return (
    [
      now.getFullYear(),
      pad(now.getMonth() + 1),
      pad(now.getDate()),
      pad(now.getHours()),
      pad(now.getMinutes()),
      pad(now.getSeconds()),
    ].join("-") + ".md"
  );
}

async function commitNote(octokit: Octokit, path: string, content: string) {
  const { data: ref } = await octokit.git.getRef({
    owner: ORG,
    repo: REPO,
    ref: `heads/main`,
  });

  const { data: latestCommit } = await octokit.git.getCommit({
    owner: ORG,
    repo: REPO,
    commit_sha: ref.object.sha,
  });

  const { data: blob } = await octokit.git.createBlob({
    owner: ORG,
    repo: REPO,
    content,
    encoding: "utf-8",
  });

  const { data: tree } = await octokit.git.createTree({
    owner: ORG,
    repo: REPO,
    tree: [
      {
        path,
        mode: "100644",
        type: "blob",
        sha: blob.sha,
      },
    ],
    base_tree: latestCommit.tree.sha,
  });

  const { data: commit } = await octokit.git.createCommit({
    owner: ORG,
    repo: REPO,
    message: `creating note: ${path}`,
    tree: tree.sha,
    parents: [ref.object.sha],
  });

  const { data } = await octokit.git.updateRef({
    owner: ORG,
    repo: REPO,
    ref: `heads/main`,
    sha: commit.sha,
  });

  return data;
}
