require("dotenv").config();

const path = require("path");
const cors = require("cors");
const morgan = require("morgan");
const helmet = require("helmet");
const express = require("express");
const bodyParser = require("body-parser");

const router = require("./routes");

const app = express();

app.use(bodyParser.json());
app.use("/", router);

app.use(
  express.urlencoded({
    limit: "50mb",
    extended: false,
    parameterLimit: 1000000,
  })
);
app.use(cors());
app.use(helmet());
app.use(morgan("short"));
app.use(express.static(path.join(__dirname, "public")));

// catch 404 and forward to error handler
app.use((req, res, next) => {
  const error = new Error(`${req.method} ${req.url} 라우터가 없습니다.`);
  console.error(`${req.method} ${req.url} 라우터가 없습니다.`);
  error.status = 404;
  next(error);
});

// error handler
app.use((err, req, res, next) => {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};
  console.error(err);

  // render the error page
  res.status(err.status || 500);
  res.send("error");
});

module.exports = app;
