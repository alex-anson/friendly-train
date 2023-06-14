// @ts-check
const express = require("express");
const app = express();

const PORT = 3000;
const SUPER_SECRET_TOKEN = "gw_config_user_token";

app.use(express.json()); // for parsing application/json
// ^ MIDDLEWARE

// app.use(authMiddleware);

// app.use(express.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded

// REQUIRES GW TOKEN
app.post("/example", authMiddleware, (req, res) => {
  // req.body -- by default it's undefined. only populated when you use body-parsing
  // middleware -- app.use(express.json())
  console.log("edge device", req.body);
});

app.post("/public", (req, res) => {
  console.log("edge device PUBLIC route", req.body);

  return res.status(200).send("SPARKLES from edge");
});

app.listen(PORT, () => {
  console.log(`listening on port ${PORT}`);
});

// only return response if something goes wrong
function authMiddleware(req, res, next) {
  if (req.headers?.["authorization"] !== SUPER_SECRET_TOKEN) {
    return res.status(403).send("WRONG TOKEN. no auth for you");
  }

  console.log("token matches");
  next();
}
