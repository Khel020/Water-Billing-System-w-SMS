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
  applicants.GetTotalApplicants(req.body).then((result) => {
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
route.get("/getPendingApprovals", (req, res) => {
  applicants.getPendingApplicants(req.body).then((result) => {
    console.log("Result is", result);
    res.send(result);
  });
});
route.get("/getInstallingApplicants", (req, res) => {
  applicants
    .getInstallingApplicants()
    .then((result) => {
      console.log("Installing Applicants:", result);
      res.send(result);
    })
    .catch((error) => {
      console.error("Error fetching installing applicants:", error);
      res.status(500).send({ message: "Internal server error" });
    });
});
route.put("/approveApplicant/:id", (req, res) => {
  applicants
    .approveApplicant(req.params.id, req.body)
    .then((result) => {
      console.log("Result is", result);
      res.send(result);
    })
    .catch((error) => {
      console.error("Error approving applicant:", error);
      res.status(500).send({ message: "Internal server error" });
    });
});
route.put("/doneInstallation/:id", (req, res) => {
  applicants
    .doneInstall(req.params.id, req.body)
    .then((result) => {
      console.log("Result is", result);
      res.send(result);
    })
    .catch((error) => {
      console.error("Error approving applicant:", error);
      res.status(500).send({ message: "Internal server error" });
    });
});
