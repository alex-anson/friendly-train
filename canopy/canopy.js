// @ts-check
const express = require("express");
const app = express();
const http = require("http"); // (LATER) mutate the request object + use axios, instead of using the http module?
const fs = require("fs");

// Contains gw boolean, port, and gw token
const configBuffer = fs.readFileSync("canopy-config.json");
const configuration = JSON.parse(configBuffer.toString());

const PORT = configuration["port"];
// Will only be present if gw is true
const GW_TOKEN = configuration["gw_token"];

// MIDDLEWARE
app.use(express.json());
app.use(authMiddleware);
app.use(checkTokenMiddleware);

// how to determine if it's from the gateway....
// how to determine if it's something we want to proxy/forward.....

// REQUIRES GW TOKEN
app.post("/private-route", (req, res) => {
  // req.body -- by default it's undefined. only populated when you use body-parsing
  // middleware -- app.use(express.json())
  console.log("edge device", req.body);
});

app.post("/public-route", (req, res) => {
  console.log("edge device PUBLIC route", req.body);

  return res.status(200).send("SPARKLES from edge");
});

app.listen(PORT, () => {
  console.log(`listening on port ${PORT}`);
});

// ------------------------------------

const postData = JSON.stringify({ proxy: "from GW server" });

app.post("/example", (req, res) => {
  console.log("UID", req["user"]["uid"]);

  // Check permissions.
  if (req["user"]["permissions"]["canPostToPrivateRoute"] !== true) {
    return res
      .status(403)
      .send("you don't have permission to post to /private-route");
  }

  const options = {
    // host: "localhost", // localhost is default
    port: 3000,
    path: "/example",
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Content-Length": Buffer.byteLength(postData),
      Authorization: GW_TOKEN,
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
}

app.post("/public", (req, res) => {
  const options = {
    // host: "localhost", // localhost is default
    port: 3000,
    path: "/public",
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Content-Length": Buffer.byteLength(postData),
      Authorization: GW_TOKEN,
    },
  };

  const clientRequest = http.request(options);
  clientRequest.write(postData);
  clientRequest.end();
  res.end();
});

///////////////////////////////////////
// Middleware, helper function, fake DB object
const publicRouteList = ["/public-route"]; // used to bypass certain middleware.

/**
 * Check if there's a token/if the token matches the GW config token. For authenticating
 * requests to the edge device. If there's no token, can only access public routes.
 */
function authMiddleware(req, res, next) {
  if (publicRouteList.includes(req.path)) {
    console.log("route is public. exiting authMiddleware function");
    return next();
  }

  console.log("auth middleware running...");
  if (req.headers?.["authorization"] !== GW_TOKEN) {
    return res.status(403).send("wrong token or no token present");
  }

  console.log("TOKEN MATCHES, proceed.");
  next();
}

/** Decode and verify user's JWT token. Add user object to request. */
function checkTokenMiddleware(req, res, next) {
  if (publicRouteList.includes(req.path)) {
    console.log("route is public. exiting checkTokenMiddleware function");
    return next();
  }

  if (!req.headers?.authorization) {
    // no token present
    return res.status(403).send("you are not authenticated");
  }

  const parsedToken = req.headers.authorization.split(" ")[1];

  // add user to the request object before continuing
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
  // doesn't have permission to talk to edge device
  jwt_user_token_2345: {
    userName: "bro",
    uid: 12,
    permissions: { canPostToPrivateRoute: false },
  },
  // has permission
  jwt_user_token_1234: {
    userName: "another user",
    uid: 11,
    permissions: { canPostToPrivateRoute: true },
  },
};
