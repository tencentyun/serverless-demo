const bodyParser = require('body-parser');
const express = require("express");
const path = require("path");
const TLSSigAPIv2 = require('tls-sig-api-v2');

const sdkappid = process.env.SDK_APP_ID;
const secret = process.env.SECRET;

const app = express();
const generationAPI = new TLSSigAPIv2.Api(sdkappid, secret);

app.use(bodyParser.json());

// Routes
app.post("/", function (req, res) {
  const userID = `${req.body.userID}`;
  const userSig = generationAPI.genUserSig(userID, 600000);
  res.send({ userID: userID, userSig: userSig })
});

app.get("/404", (req, res) => {
  res.status(404).send("Not found");
});

app.get("/500", (req, res) => {
  res.status(500).send("Server Error");
});

// Error handler
app.use(function (err, req, res, next) {
  console.error(err);
  res.status(500).send("Internal Serverless Error");
});

app.listen(9000, () => {
  console.log(`Server start on http://localhost:9000`);
});
