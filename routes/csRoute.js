const exp = require("express");
const route = exp.Router();
const customerctrl = require("../controllers/clientController.js");
const auth = require("../middleware/Auth.js");

module.exports = route;

route.post("/newConsumer", (req, res) => {
  console.log("Adding Consumer");
  customerctrl.CreateClient(req.body).then((result) => {
    res.send(result);
  });
});
route.get("/totalapplicants", (req, res) => {
  customerctrl.GettingClients(req.body).then((result) => {
    res.send(result);
  });
});
route.get("/applicants", (req, res) => {
  console.log("Aasdasdasd");
  console.log(req.body);
  customerctrl.GettingApplicants(req.body).then((result) => {
    console.log("Result is", result);
    res.send(result);
  });
});
route.put("/update_inspect", (req, res) => {
  customerctrl.InspectedStatus(req.body).then((result) => {
    res.send(result);
  });
});
