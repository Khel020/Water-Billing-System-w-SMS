const exp = require("express");
const route = exp.Router();
const customerctrl = require("../controllers/clientController.js");
const auth = require("../middleware/Auth.js");
const applicants = require("../controllers/applicantsCtrl.js");
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
route.post("/newApplicant", (req, res) => {
  applicants.createApplication(req.body).then((result) => {
    console.log("Result is", result);
    res.send(result);
  });
});
route.get("/applicants", (req, res) => {
  console.log("Aasdasdasd");

  applicants.getApplications(req.body).then((result) => {
    console.log("Result is", result);
    res.send(result);
  });
});
route.post("/scheduleInspec", (req, res) => {
  applicants.Schedule(req.body).then((result) => {
    console.log("Result is", result);
    res.send(result);
  });
});
route.put("/doneInspec/:account", (req, res) => {
  const { account } = req.params;
  applicants.DoneInspection(account).then((result) => {
    console.log("Result is", result);
    res.send(result);
  });
});
route.get("/getApplicants", (req, res) => {
  console.log("Aasdasdasd");
  console.log(req.body);
  applicants.GetTotalApplicants(req.body).then((result) => {
    console.log("Result is", result);
    res.send(result);
  });
});
route.put("/update_inspect", (req, res) => {
  customerctrl.InspectedStatus(req.body).then((result) => {
    res.send(result);
  });
});
route.put("/scheduleInstall", (req, res) => {
  applicants.ScheduleInstall(req.body).then((result) => {
    console.log("Result is", result);
    res.send(result);
  });
});
