const express = require("express");
const app = express();
const http = require("http"); // (LATER) mutate the request object + use axios, instead of using the http module?
const fs = require("fs");
const program = require("commander");

///////////////////////////////////////
// #region Setup
let PORT, isGWMode, GW_TOKEN;

function getCliArgs() {
  program.name("can-o-py");
  program.option("-gw", "start server in gateway mode");
  program.parse(process.argv);
  return program.opts();
}

function init() {
  const gateway = getCliArgs();
  if (gateway["Gw"]) {
    console.log("starting GW server...");
    // Contains gw boolean (true), port, and gw token
    const gwConfigBuffer = fs.readFileSync("gw-config.json");
    const gwConfig = JSON.parse(gwConfigBuffer.toString());

    PORT = gwConfig["port"];
    isGWMode = gwConfig["gw"];
    GW_TOKEN = gwConfig["gw_token"];
  } else {
    console.log("starting edge server...");
    // Contains gw boolean (false) and port
    const edgeConfigBuffer = fs.readFileSync("edge-config.json");
    const edgeConfig = JSON.parse(edgeConfigBuffer.toString());

    PORT = edgeConfig["port"];
    isGWMode = edgeConfig["gw"];
  }
}
init();
// #endregion Setup
///////////////////////////////////////

// MIDDLEWARE
app.use(express.json());
app.use(authMiddleware);
app.use(checkTokenMiddleware);

// REQUIRES GW TOKEN
app.post("/private-route", (req, res) => {
  if (!isGWMode) {
    // if we're not in gw mode, they don't have a gw token. and they can't post to this route.
    return res.status(403).send("not authorized");
  }

  console.log("UID", req["user"]["uid"]);

  // Check permissions.
  if (req["user"]["permissions"]["canPostToPrivateRoute"] !== true) {
    return res
      .status(403)
      .send("you don't have permission to post to /private-route");
  }

  // Forward the request to the edge device.

  const options = {
    // host: "localhost", // localhost is default
    port: PORT,
    path: "/private-route",
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

// No authentication required.
app.post("/public-route", (req, res) => {
  if (!isGWMode) {
    console.log("not in GW mode - request made directly from an edge device");
    return res.status(200).send("💥 edge device response");
  }

  // Forward the request to the edge device  ...add the GW token even though it's not required in this case...?

  const options = {
    port: 4200, // edge device's port
    path: "/public-route",
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

  console.log("edge device PUBLIC route", req.body);

  return res.status(200).send("SPARKLES from edge");
});

app.listen(PORT, () => {
  console.log(`listening on port ${PORT}`);
});

// ------------------------------------

const postData = JSON.stringify({ proxy: "from GW server" });

// callback is optional
function callback(res) {
  res.setEncoding("utf8");
  console.log(`STATUS: ${res.statusCode}`);
  res.on("data", function (chunk) {
    console.log("body: " + chunk);
  });
}

///////////////////////////////////////
// #region SECTION:  Middleware, helper function, fake DB object
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
// #endregion  Middleware, helper function, fake DB object
