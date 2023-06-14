// @ts-check
const express = require("express");
const app = express();

const PORT = 3000;
const SUPER_SECRET_TOKEN = "gw_config_user_token";

app.use(express.json()); // for parsing application/json
// ^ MIDDLEWARE

// app.use(express.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded

app.post("/example", (req, res) => {
  // req.body -- by default it's undefined. only populated when you use body-parsing
  // middleware -- app.use(express.json())
  console.log("edge device", req.body);

  if (req.headers.authorization) {
    console.log("token found in headers");
    // check token matches
    if (req.headers.authorization === SUPER_SECRET_TOKEN) {
      // logged in, GW
      console.log("token matches");
      return res.status(200).send("yay 🎉 from edge server");
    } else {
      return res.status(403).send("WRONG TOKEN. no auth for you");
    }
  } else {
    // operator users
    console.log("no token found. request must be from edge device.");
    return res.status(200).send("SPARKLES from edge");
  }
});

app.listen(PORT, () => {
  console.log(`listening on port ${PORT}`);
});
