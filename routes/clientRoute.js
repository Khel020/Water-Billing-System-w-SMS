const exp = require("express");
const route = exp.Router();
const controller = require("../controllers/clientController.js");
const authMiddleware = require("../controllers/newLogin");

module.exports = route;

route.get("/clients", (req, res) => {
  console.log("Loading Clients");
  console.log(req.body);
  controller.GetAllClients(req.body).then((result) => {
    res.send(result);
  });
});
route.post("/newclient", (req, res) => {
  console.log("Adding New Client");
  console.log(req.body);
  controller.CreateClient(req.body).then((result) => {
    res.send(result);
  });
});
route.put("/editClient", (req, res) => {
  console.log("Updating Client");
  console.log(req.body);
  controller.UpdateClientByAccNum(req.body).then((result) => {
    res.send(result);
  });
});
route.delete("/deleteClient", (req, res) => {
  console.log("Archiving..");
  console.log(req.body);
  controller
    .ArchiveClient(req.body)
    .then((result) => {
      res.send(result);
    })
    .catch((err) => {
      console.log(err);
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
