// @ts-check
const express = require("express");
const app = express();

// Middleware
app.use(express.json()); // for parsing application/json
app.use(express.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded

const PORT = 3000;

app.get("/", (_, res) => res.send("Hello World"));

const sendHTML = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Fox is Best</title>
</head>
<body>
    <div style="font-size: 96px;">🦊 🔥 🦊 🔥 🦊 🔥 🦊</div>
</body>
</html>
`;

app.get("/fox", (req, res) => {
  const { name } = req.query;
  if (typeof name !== "string") {
    return res.status(200).send(sendHTML);
  }
  res.send(`hey there, ${name} 🦊`);
});

app.get("/fox/:id", (req, res) => {
  const { id } = req.params;
  res.send(`user id: ${id} 🦊`);
});

app.post("/fox", (req, res) => {
  const postData = req.body;
  const { note, date } = postData;
  res.send(`YOU HAVE A NEW NOTE: "${note}" \nSent: ${date}`);
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}`);
});

/**
 * cute console.logs
 console.log(
  "%c MESSAGE HERE yay",
  "background: #fff; color: #000"
);
 */
