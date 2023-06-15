// @ts-check
const express = require("express");
const app = express();
const axios = require("axios").default;
const fs = require("fs");
const program = require("commander").program;

///////////////////////////////////////
// #region Setup
let PORT;
let isGWMode;
/** @type string */
let GW_TOKEN;

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
    const gwConfigBuffer = fs.readFileSync("gw-config.json");
    const gwConfig = JSON.parse(gwConfigBuffer.toString());

    PORT = gwConfig["port"];
    isGWMode = gwConfig["gw"];
    GW_TOKEN = gwConfig["gw_token"];
  } else {
    console.log("starting edge server...");
    const edgeConfigBuffer = fs.readFileSync("edge-config.json");
    const edgeConfig = JSON.parse(edgeConfigBuffer.toString());

    PORT = edgeConfig["port"];
    isGWMode = edgeConfig["gw"];
    // edge device has access to the gw token. it's the USER who may or may not have it.
    GW_TOKEN = edgeConfig["gw_token"];
  }
}
init();
// #endregion Setup
///////////////////////////////////////

const postData = JSON.stringify({ data: "some POST data" });

// MIDDLEWARE
app.use(express.json());
if (isGWMode) {
  app.use(verifyUserTokenMiddleware);
}
if (!isGWMode) {
  app.use(checkForGwTokenMiddleware);
}

// REQUIRES GW TOKEN
if (isGWMode) {
  app.post("/private-route-make-biscuits", handleGwBiscuits);
}
if (!isGWMode) {
  app.post("/private-route-make-biscuits", handleEdgeBiscuits);
}

function handleGwBiscuits(req, res) {
  console.log("UID", req["user"]["uid"]);

  // Check permissions.
  if (req["user"]["permissions"]["canPostToPrivateRoute"] !== true) {
    return res
      .status(403)
      .send(
        "you don't have permission to post to /private-route-make-biscuits"
      );
  }

  // Forward the request to the edge device.

  const options = {
    // port: 4200, // edge device's port
    url: "http://localhost:4200/private-route-make-biscuits",
    method: "post",
    headers: {
      "Content-Type": "application/json",
      "Content-Length": Buffer.byteLength(postData),
      Authorization: GW_TOKEN,
    },
    data: postData,
  };

  axios(options)
    .then((axRes) => {
      console.log(axRes.config.headers);
      console.log(axRes.statusText);
      console.log("DATA 🔥", axRes.data);
      res
        .status(200)
        .send(`response via gateway forwarded request: ${axRes.data}`);
    })
    .catch((e) => {
      console.log(e);
      console.log("ERROR 🔥");
      res.status(400).send("uh oh");
    });
}

function handleEdgeBiscuits(_, res) {
  return res.status(200).send("MAKE BISCUITS YAY 🥐");
}

// No authentication required.
app.post("/public-route-eat-biscuits", (_, res) => {
  if (!isGWMode) {
    return res.status(200).send("eat biscuits 💥");
  }

  // Forward the request to the edge device  ...add the GW token even though it's not required in this case...?

  const options = {
    // port: 4200, // edge device's port
    url: "http://localhost:4200/public-route-eat-biscuits",
    method: "post",
    headers: {
      "Content-Type": "application/json",
      "Content-Length": Buffer.byteLength(postData),
      Authorization: GW_TOKEN,
    },
    data: postData,
  };

  axios(options)
    .then((axRes) => {
      console.log(axRes.config.headers);
      console.log(axRes.statusText);
      console.log("DATA 🔥", axRes.data);
      res
        .status(200)
        .send(`response via gateway forwarded request: ${axRes.data}`);
    })
    .catch((e) => {
      console.log(e);
      console.log("ERROR 🔥");
      res.status(400).send("uh oh");
    });
});

app.listen(PORT, () => {
  console.log(`listening on port ${PORT}`);
});

///////////////////////////////////////
// #region SECTION:  Middleware, helper function, fake DB object
const publicRouteList = ["/public-route-eat-biscuits"]; // used to bypass certain middleware.

/**
 * Check if there's a token/if the token matches the GW config token. For authenticating
 * requests to the edge device. If there's no token, can only access public routes.
 *
 * Used on edge devices
 */
function checkForGwTokenMiddleware(req, res, next) {
  if (publicRouteList.includes(req.path)) {
    console.log("route is public. exiting checkForGwTokenMiddleware function");
    return next();
  }

  console.log("check for gw token middleware running...");
  if (req.headers?.["authorization"] !== GW_TOKEN) {
    return res.status(403).send("wrong token or no token present");
  }

  console.log("TOKEN MATCHES, proceed.");
  next();
}

/**
 * WHO is sending the request .. intended to be used on GW device
 * Decode and verify user's JWT token. Add user object to request.
 */
function verifyUserTokenMiddleware(req, res, next) {
  if (publicRouteList.includes(req.path)) {
    console.log("route is public. exiting verifyUserTokenMiddleware function");
    return next();
  }
  console.log("verify user token middleware running...");

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
    userName: "John Smith",
    uid: 12,
    permissions: { canPostToPrivateRoute: false },
  },
  // has permission
  jwt_user_token_1234: {
    userName: "Jane Smith",
    uid: 11,
    permissions: { canPostToPrivateRoute: true },
  },
};
// #endregion  Middleware, helper function, fake DB object
