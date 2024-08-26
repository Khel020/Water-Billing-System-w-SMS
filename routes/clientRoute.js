const exp = require("express");
const route = exp.Router();
const controller = require("../controllers/clientController.js");
const auth = require("../middleware/Auth.js");

module.exports = route;
route.get("/clients", auth.BillerOnly, (req, res) => {
  console.log("Loading Clients");
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
