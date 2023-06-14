// @ts-check
const express = require("express");
const app = express();

const PORT = 3000;

// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));

app.post("/example", (req, res) => {
  // req.body ... get what's coming from gw
  console.log("edge device", req.body);
  res.send("SPARKLES from edge");
});

app.listen(PORT, () => {
  console.log(`listening on port ${PORT}`);
});
