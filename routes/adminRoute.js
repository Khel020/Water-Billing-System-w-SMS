const exp = require("express");
const route = exp.Router();
const controller = require("../controllers/adminController.js");
const customerctrl = require("../controllers/clientController.js");
const ratectrl = require("../controllers/ratesController.js");
const auth = require("../middleware/Auth.js");
module.exports = route;

route.get("/customers/:acc_number", auth.AdminOnly, (req, res) => {
  console.log("Getting Customer Info");
  console.log(req.params);
  customerctrl.GetClientsByAccNum(req.params).then((result) => {
    res.send(result);
  });
});
route.get("/customers", (req, res) => {
  console.log("GETTING CLIENT!");
  customerctrl.ConsumersWithBill(req.body).then((result) => {
    console.log(result);
    res.send(result);
  });
});
route.post("/addRates", auth.AdminOnly, (req, res) => {
  console.log("Adding Rates");
  console.log(req.body);
  ratectrl.addRate(req.body).then((result) => {
    res.send(result);
  });
});

route.post("/newclient", (req, res) => {
  console.log("Adding New Client");
  console.log(req.body);
  customerctrl.CreateClient(req.body).then((result) => {
    res.send(result);
  });
});
route.put("/editClient", (req, res) => {
  console.log("Updating Client");
  console.log(req.body);
  customerctrl.UpdateClientByAccNum(req.body).then((result) => {
    res.send(result);
  });
});
route.delete("/deleteClient", (req, res) => {
  console.log("Archiving..");
  console.log(req.body);
  customerctrl
    .ArchiveClient(req.body)
    .then((result) => {
      res.send(result);
    })
    .catch((err) => {
      console.log(err);
    });
});

route.get("/admins", (req, res) => {
  console.log("Loading Admins");
  console.log(req.body);
  controller.GetAdmin(req.body).then((result) => {
    res.send(result);
  });
});

route.post("/add", (req, res) => {
  console.log("Adding Admin Acc");
  console.log(req.body);
  controller.CreateAdmin(req.body).then((result) => {
    res.send(result);
  });
});
route.post("/addstaffs", (req, res) => {
  console.log("Adding Admin Acc");
  console.log(req.body);
  controller.CreateAdmin(req.body).then((result) => {
    res.send(result);
  });
});
route.put("/editAdmin", (req, res) => {
  console.log("Updating Admin");
  console.log(req.body);
  controller.UpdateAdminByID(req.body).then((result) => {
    res.send(result);
  });
});
