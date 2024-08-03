const exp = require("express");
const route = exp.Router();
const controller = require("../controllers/clientController.js");

module.exports = route;

//Get = For get
//Post= Add New Data
//Put = Update/Edit
//Delete = Delete
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
  controller.UpdateClientByID(req.body).then((result) => {
    res.send(result);
  });
});
route.delete("/deleteClient", (req, res) => {
  console.log("Updating Client");
  console.log(req.body);
  controller
    .UpdateClientByID(req.body)
    .then((result) => {
      res.send(result);
    })
    .catch((err) => {
      console.log(err);
    });
});
