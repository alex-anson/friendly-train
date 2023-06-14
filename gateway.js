// @ts-check
const express = require("express");
const http = require("http");
const app = express();

// app.use(express.json()); // for parsing application/json

const SUPER_SECRET_TOKEN = "cool_token_bro";
const PORT = 3001;
// const otherUrl = "http://localhost:3000/example";

const postData = JSON.stringify({ proxy: "from GW server" });

app.post("/example", (_, res) => {
  const options = {
    // host: "localhost", // localhost is default
    port: 3000,
    path: "/example",
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Content-Length": Buffer.byteLength(postData),
      Token: SUPER_SECRET_TOKEN,
    },
    // body: postData,
  };

  const clientRequest = http.request(options, callback);
  clientRequest.write(postData);
  clientRequest.end();
  res.end();
});

// callback is optional
function callback(res) {
  console.log(`STATUS: ${res.statusCode}`);
  // console.log(`HEADERS: ${JSON.stringify(res.headers)}`);
  res.setEncoding("utf8");
  console.log("done");
}

app.listen(PORT, () => {
  console.log(`listening on port ${PORT}`);
});
