// @ts-check
const express = require("express");
const http = require("http");
const app = express();

app.use(express.json()); // for parsing application/json

app.use(checkTokenMiddleware);

const SUPER_SECRET_TOKEN = "gw_config_user_token";
const PORT = 3001;
// const otherUrl = "http://localhost:3000/example";

const postData = JSON.stringify({ proxy: "from GW server" });

app.post("/example", (req, res) => {
  // validate token & get useable data
  console.log("USER", req["user"]);

  const options = {
    // host: "localhost", // localhost is default
    port: 3000,
    path: "/example",
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Content-Length": Buffer.byteLength(postData),
      Authorization: SUPER_SECRET_TOKEN,
    },
  };

  const clientRequest = http.request(options, callback);
  clientRequest.write(postData);
  clientRequest.end();
  res.end();
});

// callback is optional
function callback(res) {
  res.setEncoding("utf8");
  console.log(`STATUS: ${res.statusCode}`);
  res.on("data", function (chunk) {
    console.log("body: " + chunk);
  });
  // console.log(`HEADERS: ${JSON.stringify(res.headers)}`);
  console.log("done");
}

app.listen(PORT, () => {
  console.log(`listening on port ${PORT}`);
});

function checkTokenMiddleware(req, res, next) {
  // console.log(req.headers);
  if (!req.headers?.authorization) {
    // user not authenticated
    return res.status(403).send("byyyeeee");
  }

  // parse token
  const parsedToken = req.headers.authorization.split(" ")[1];

  req.user = verifyToken(parsedToken);

  if (!req.user) {
    return res.status(401).send("user not found");
  }

  next();
}

function verifyToken(token) {
  // decode token
  const decoded = fakeDB[token];

  // return expected object
  return decoded;
}

const fakeDB = {
  jwt_user_token_2345: {
    userName: "bro",
    uid: 12,
  },
  shitty_token_bro: {
    userName: "another user",
    uid: 11,
  },
};
