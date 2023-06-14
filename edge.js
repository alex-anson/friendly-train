// @ts-check
const express = require("express");
const app = express();

const PORT = 3000;

app.use(express.json()); // for parsing application/json
// ^ MIDDLEWARE

// app.use(express.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded

app.post("/example", (req, res) => {
  // req.body -- by default it's undefined. only populated when you use body-parsing
  // middleware -- app.use(express.json())
  console.log("edge device", req.body);
  res.send("SPARKLES from edge");
});

app.listen(PORT, () => {
  console.log(`listening on port ${PORT}`);
});
