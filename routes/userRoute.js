const exp = require("express");
const route = exp.Router();
const controller = require("../controllers/userController.js");
const CLIENT = require("../controllers/clientController");

module.exports = route;

route.get("/users", (req, res) => {
  console.log("Loading Clients");
  console.log(req.body);
  controller.GetAllUsers(req.body).then((result) => {
    res.send(result);
  });
});
route.post("/newUser", (req, res) => {
  console.log("Adding New Client");
  console.log(req.body);
  controller.CreateUser(req.body).then((result) => {
    console.log(result);
    res.send(result);
  });
});
route.put("/editUser", (req, res) => {
  console.log("Updating Client");
  console.log(req.body);
  controller.UpdateUserByID(req.body).then((result) => {
    res.send(result);
  });
});
route.delete("/deleteUser", (req, res) => {
  console.log("Updating Client");
  console.log(req.body);
  controller
    .DeleteClientByID(req.body)
    .then((result) => {
      res.send(result);
    })
    .catch((err) => {
      console.log(err);
    });
});
route.post("/checkAccount", async (req, res) => {
  console.log("Checking Account");
  console.log(req.body);

  try {
    const result = await CLIENT.CheckAccount(req.body);
    res.send(result);
  } catch (err) {
    console.error(err);
    res.status(500).send({ error: "Server error" });
  }
});
