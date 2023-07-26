const credential = Credential.create("Pidge", "Insert pidge secret");
credential.addPasswordField("pidgetoken", "Pidge Token");
credential.addPasswordField("githubtoken", "Github Token");

credential.authorize();

const pidgeToken = credential.getValue("pidgetoken").toString().trim();
const githubToken = credential.getValue("githubtoken").toString().trim();
const pidgeEndpoint = "https://pidge.vercel.app/api/note";

const obj = {
  url: pidgeEndpoint,
  method: "POST",
  data: {
    pidgeToken,
    githubToken,
    note: {
      name: getDatedNoteName(),
      text: draft.content,
    },
  },
};

console.log("req: " + JSON.stringify(obj, null, "  "));
const req = HTTP.create();
const response = req.request(obj);

if (response.statusCode != 200 && response.statusCode != 202) {
  console.log("Request failed. Status code: " + response.statusCode);
  context.fail();
} else {
  console.log("res: " + JSON.stringify(response.responseData, null, "  "));
}

function pad(num) {
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
