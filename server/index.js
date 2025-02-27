const express = require("express");
const connectDb = require("./config/dbConnection");
const http = require("http");
const { socketManager } = require("./socketManager");
const cors = require("cors");
const dotenv = require("dotenv").config();

const port = process.env.PORT || 5000;

const app = express();
app.use(cors());
app.use(function (req, res, next) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Allow-Credentials", true);
  next();
});
app.use(express.json());

const server = http.createServer(app);

connectDb();
socketManager(server);

app.use("/user", require("./routes/userRoutes"));
app.use("/home", require("./routes/chatRoutes"));

server.listen(port, () => {
  console.log(`Server is running on ${port}`);
});
