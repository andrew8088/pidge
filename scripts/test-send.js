const baseUrl = process.env.PIDGE_URL ?? "http://localhost:3000";

main();

function main() {
  const body = getBody();
  console.log(body);
  fetch(`${baseUrl}/api/note`, {
    method: "post",
    body,
    headers: { "Content-Type": "application/json" },
  })
    .then((res) => res.json())
    .then((json) => console.log(JSON.stringify(json, null, "  ")))
    .catch(console.log);
}

function getBody() {
  invariant(process.env.PIDGE_SECRET, "must provide PIDGE_SECRET");
  invariant(process.env.GITHUB_TOKEN, "must provide PIDGE_SECRET");

  const [_1, _2, text] = process.argv;

  invariant(text, "must provide text");

  return JSON.stringify({
    pidgeToken: process.env.PIDGE_SECRET,
    githubToken: process.env.GITHUB_TOKEN,
    note: {
      text,
    },
  });
}

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}
