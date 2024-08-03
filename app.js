const exp = require("express"); // for server
const mng = require("mongoose"); //wrapper library for database
const env = require("dotenv").config(); // for secret variables
const crs = require("cors"); // sino lang ang pwede mag access sang server
const admin = require("./routes/adminRoute.js");
const CLIENT = require("./routes/clientRoute.js");
const USERS = require("./routes/userRoute.js");
const LOGIN = require("./routes/Login.js");
const app = exp(); // mismong server
const pnv = process.env;

const http = require("http"); // for http server
const { Server } = require("socket.io"); //
app.use(crs()); //
app.use(exp.json()); //
app.use("/admin", admin);
app.use("/client", CLIENT);
app.use("/user", USERS);
app.use("/login", LOGIN);

mng.connect(pnv.DB_CONNECTION_STRING);

const server = http.createServer(app);
server.listen(pnv.PORT, (req, res) => {
  console.log(`Server is connected at PORT ${pnv.PORT}`);
});

mng.connection.once("open", (req, res) => {
  console.log("Server is now connected to the database");
});
