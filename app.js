const exp = require("express"); // for server
const mng = require("mongoose"); //wrapper library for database
const env = require("dotenv").config(); // for secret variables
const crs = require("cors"); // sino lang ang pwede mag access sang server
const admin = require("./routes/adminRoute.js");
const CLIENT = require("./routes/consumerRoute.js");
const CASHIER = require("./routes/cashierRoute.js");
const USERS = require("./routes/userRoute.js");
const LOGIN = require("./routes/Login.js");
const DATAENTRY = require("./routes/dataentryRoute.js");
const INFOTECH = require("./routes/InfoTechRoute.js");
const app = exp(); // mismong server
const http = require("http"); // for http server
const server = http.createServer(app);
const socketIo = require("socket.io");
const io = socketIo(server);
const pnv = process.env;

app.use(crs()); //
app.use(exp.json()); // middleware

app.use("/admin", admin);
app.use("/infoTech", INFOTECH);
app.use("/biller", CASHIER);
app.use("/client", CLIENT);
app.use("/dataentry", DATAENTRY);
app.use("/user", USERS);
app.use("/login", LOGIN);

mng.connect(pnv.DB_CONNECTION_STRING);

server.listen(pnv.PORT, (req, res) => {
  console.log(`Server is connected at PORT ${pnv.PORT}`);
});

mng.connection.once("open", (req, res) => {
  console.log("Server is now connected to the database");
});
