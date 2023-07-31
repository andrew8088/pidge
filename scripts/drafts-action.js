const credential = Credential.create("Pidge", "Insert pidge secret");
credential.addPasswordField("pidgetoken", "Pidge Token");
credential.addPasswordField("githubtoken", "Github Token");

credential.authorize();

const pidgeToken = credential.getValue("pidgetoken").toString().trim();
const githubToken = credential.getValue("githubtoken").toString().trim();
const pidgeEndpoint = "https://pidge.vercel.app/api/note";

const hasMicroTag = draft.tags.some((t) => t === "micro");
const isPublished = draft.tags.some((t) => t === "published");

if (!hasMicroTag) {
  context.fail("note must have micro tag");
} else if (isPublished) {
  context.fail("note already published");
} else {
  const obj = {
    url: pidgeEndpoint,
    method: "POST",
    data: {
      pidgeToken,
      githubToken,
      note: {
        tags: draft.tags.filter((t) => t !== "micro"),
        text: draft.content,
      },
    },
  };

  const req = HTTP.create();
  const response = req.request(obj);

  if (response.statusCode != 200 && response.statusCode != 202) {
    console.log("Request failed. Status code: " + response.statusCode);
    console.log(JSON.stringify(response));
    context.fail();
  } else {
    const name = response.responseData.note.name;
    draft.addTag(`title:${name}`);
    console.log("res: " + JSON.stringify(response.responseData, null, "  "));
  }
}
