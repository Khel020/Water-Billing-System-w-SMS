const exp = require("express");
const route = exp.Router();
const controller = require("../controllers/clientController.js");
const auth = require("../middleware/Auth.js");

module.exports = route;

route.get("/consumerForSMS", async (req, res) => {
  try {
    console.log("Fetching Consumers for SMS...");

    const result = await controller.GetConsumerForSMS();
    console.log("Result", result);
    res.status(200).json(result);
  } catch (error) {
    console.error("Error fetching consumers for SMS:", error);

    res.status(500).json({ message: "Failed to retrieve consumer for SMS." });
  }
});
route.get("/clients", (req, res) => {
  controller.ConsumersWithBill(req.body).then((result) => {
    res.send(result);
  });
});

route.get("/:id", async (req, res) => {
  try {
    const client = await controller.findById(req.params.acc_num);
    if (!client) {
      return res.status(404).json({ message: "Client not found" });
    }
    res.json(client);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
