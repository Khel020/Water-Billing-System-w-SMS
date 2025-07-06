const exp = require("express");
const mng = require("mongoose");
const env = require("dotenv").config();
const crs = require("cors");
const http = require("http");
const cron = require("node-cron");
const { Server } = require("socket.io");
const { SerialPort } = require("serialport");
const bodyParser = require("body-parser");

// Import routes
const admin = require("./routes/adminRoute.js");
const CSOFFICER = require("./routes/csRoute.js");
const CLIENT = require("./routes/consumerRoute.js");
const CASHIER = require("./routes/cashierRoute.js");
const USERS = require("./routes/userRoute.js");
const LOGIN = require("./routes/Login.js");
const DATAENTRY = require("./routes/dataentryRoute.js");
const INFOTECH = require("./routes/InfoTechRoute.js");
const TOKEN = require("./routes/validateToken.js");
const BILL = require("./models/BillsModel.js"); // Adjust the path as needed
const clientmodel = require("./models/clientModel.js");
const app = exp();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
  },
});

const pnv = process.env;

// Middleware
app.use(crs());
app.use(exp.json());
app.use(bodyParser.json());

// Initialize SerialPort for Arduino
const serialPort = new SerialPort({
  path: "COM3",
  baudRate: 9600,
  dataBits: 8,
  stopBits: 1,
  parity: "none",
});

// Log when port opens
serialPort.on("open", () => {
  console.log("Serial port opened successfully");
});

// Log any errors
serialPort.on("error", (err) => {
  console.error("Serial port error:", err);
});

const PENALTY_RATE = 0.1; // 10% penalty

cron.schedule("* * * * *", async () => {
  console.log("Running cron job to check overdue bills...");

  try {
    const today = new Date().toISOString().split("T")[0]; // Get today's date (YYYY-MM-DD)

    // Find all unpaid bills that are due today or earlier, and not yet penalized
    const overdueBills = await BILL.find({
      due_date: { $lte: today },
      payment_status: "Unpaid",
      penaltyApplied: false,
    });

    console.log("Overdue Bills:", overdueBills.length);

    if (overdueBills.length === 0) return; // Exit if no overdue bills

    let updatedCount = 0;

    for (const bill of overdueBills) {
      const newPenalty = bill.currentBill * PENALTY_RATE;
      console.log("NEW PENALTY:", newPenalty);

      // Compute new TotalDue
      const updatedCurrentBill = bill.currentBill + newPenalty;
      console.log("Updated TotalDue:", updatedCurrentBill);

      // Update the bill
      await BILL.updateOne(
        { _id: bill._id },
        {
          $set: {
            p_charge: bill.p_charge + newPenalty,
            currentBill: updatedCurrentBill,
            totalDue: updatedCurrentBill,
            penaltyApplied: true,
            payment_status: "Overdue",
          },
        }
      );

      // Update the client's totalBalance
      await clientmodel.updateOne(
        { acc_num: bill.acc_num },
        { $inc: { totalBalance: newPenalty } }
      );

      // 👉 Check if the client now has 3 or more unpaid bills
      const unpaidBillsCount = await BILL.countDocuments({
        acc_num: bill.acc_num,
        payment_status: { $in: ["Unpaid", "Overdue"] }, // Count both Unpaid and Overdue
      });

      console.log(
        `Client ${bill.acc_num} has ${unpaidBillsCount} unpaid bills.`
      );

      if (unpaidBillsCount >= 3) {
        // Update disconnection_status to "For Disconnection"
        await clientmodel.updateOne(
          { acc_num: bill.acc_num },
          {
            $set: {
              disconnection_status: "For Disconnection",
              status: "Inactive",
            },
          }
        );
        console.log(`Client ${bill.acc_num} marked for disconnection.`);
      }

      updatedCount++;
    }

    console.log(
      `✅ Applied penalty, updated TotalDue, checked disconnection for ${updatedCount} overdue bills.`
    );
  } catch (error) {
    console.error("❌ Error updating overdue bills:", error);
  }
});

// Function to send command and wait for response
const sendCommand = (command, delay = 1000) => {
  return new Promise((resolve, reject) => {
    console.log(`Sending command: ${command}`);

    serialPort.write(command + "\r\n", (err) => {
      if (err) {
        console.error("Error sending command:", err);
        reject(err);
        return;
      }

      // Wait for the specified delay
      setTimeout(resolve, delay);
    });
  });
};

// SMS Route with Arduino-style communication
app.post("/send-sms", async (req, res) => {
  const { acc_num, contact, message } = req.body;

  if (!contact || !message) {
    return res.status(400).json({
      success: false,
      message: "Contact number and message are required",
    });
  }

  try {
    // Format the phone number if needed (add +63 if not present)
    const formattedContact = contact.startsWith("+63")
      ? contact
      : "+63" + contact.substring(1);

    // Initialize sequence similar to Arduino
    await sendCommand("AT");
    await sendCommand("AT+CMGF=1"); // Set SMS text mode
    await sendCommand("AT+CSQ"); // Check signal quality

    // Send SMS command with phone number
    await sendCommand(`AT+CMGS="${formattedContact}"`);

    // Send the message body (with 2 second delay for longer messages)
    await sendCommand(message, 2000);

    // Send Ctrl+Z (hex 0x1A)
    await sendCommand(String.fromCharCode(26));

    return res.status(200).json({
      success: true,
      message: "SMS sent successfully",
      details: {
        accountNumber: acc_num,
        recipient: formattedContact,
        messageLength: message.length,
      },
    });
  } catch (error) {
    console.error("SMS Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to send SMS",
      error: error.message,
    });
  }
});

// Serial data logging (similar to Arduino's Serial.print)
serialPort.on("data", (data) => {
  console.log("Received:", data.toString().trim());
});

// Routes
app.use("/admin", admin);
app.use("/infoTech", INFOTECH);
app.use("/biller", CASHIER);
app.use("/client", CLIENT);
app.use("/csofficer", CSOFFICER);
app.use("/dataentry", DATAENTRY);
app.use("/user", USERS);
app.use("/login", LOGIN);
app.use("/token", TOKEN);

// Database connection
mng.connect(pnv.DB_CONNECTION_STRING);

server.listen(pnv.PORT, () => {
  console.log(`Server is connected at PORT ${pnv.PORT}`);
});

mng.connection.once("open", () => {
  console.log("Server is now connected to the database");
});

// Socket.IO connection
io.on("connection", (socket) => {
  console.log("a user connected");

  socket.on("paymentProcessed", (data) => {
    console.log("Payment processed Socket:", data);
    // Broadcast the paymentProcessed event to all connected clients
    io.emit("paymentProcessed", data);
  });

  socket.on("disconnect", () => {
    console.log("user disconnected");
  });
});
