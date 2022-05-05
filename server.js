const express = require("express");
const mongoose = require("mongoose");
const routes = require("./routes/router");
require("dotenv").config({
  path: "variables.env",
});

const app = express();

mongoose.connect(process.env.DATABASE, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useCreateIndex: true,
  useFindAndModify: false,
});

mongoose.Promise = global.Promise; // Tell Mongoose to use ES6 promises
mongoose.connection.on("error", (err) => {
  console.log(" mongoose error");
  console.error(`🙅 🚫 🙅 🚫 🙅 🚫 🙅 🚫 → ${err.message}`);
});

// 'http://localhost:3000';//dev

app.use(function (req, res, next) {
  const allowedOrigins = [
    "https://emenu-6b11d.web.app",
    "https://emenu.place",
    "http://localhost:3000",
  ];
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, OPTIONS, PUT, PATCH, DELETE"
  );
  res.setHeader("Access-Control-Allow-Headers", "*");
  res.setHeader("Access-Control-Allow-Credentials", true);
  next();
});

const port = process.env.PORT || 5000;

app.use(
  express.json({
    verify: function (req, res, buf) {
      const url = req.originalUrl;
      if (url.startsWith("/webhook")) {
        req.rawBody = buf.toString();
      }
    },
  })
);

app.use("/", routes);

app.listen(port, () => console.log(`Server started on port ${port} `));
