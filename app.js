const exp = require("express"); // for server
const mng = require("mongoose"); //wrapper library for database
const env = require("dotenv").config(); // for secret variables
const crs = require("cors"); // sino lang ang pwede mag access sang server
const admin = require("./routes/adminRoute.js");
const CLIENT = require("./routes/clientRoute.js");
const BILLER = require("./routes/billerRoutes.js");
const USERS = require("./routes/userRoute.js");
const LOGIN = require("./routes/Login.js");
const app = exp(); // mismong server
const http = require("http"); // for http server
const server = http.createServer(app);
const socketIo = require("socket.io");
const io = socketIo(server);
const pnv = process.env;

app.use(crs()); //
app.use(exp.json()); // middleware

app.use("/admin", admin);
app.use("/biller", BILLER);
app.use("/client", CLIENT);
app.use("/user", USERS);
app.use("/login", LOGIN);

mng.connect(pnv.DB_CONNECTION_STRING);

server.listen(pnv.PORT, (req, res) => {
  console.log(`Server is connected at PORT ${pnv.PORT}`);
});

mng.connection.once("open", (req, res) => {
  console.log("Server is now connected to the database");
});

io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  // Send message to the connected client
  socket.emit("message", "Welcome to the real-time billing system!");

  // Listen for custom events (e.g., bill generated)
  socket.on("billGenerated", (data) => {
    console.log("New bill generated for account:", data.accountNumber);
    // Notify all connected clients (real-time broadcast)
    io.emit("updateBills", data);
  });

  // Handle user disconnecting
  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});
