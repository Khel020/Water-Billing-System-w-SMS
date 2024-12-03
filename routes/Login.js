const express = require("express");
const route = express.Router();
const controller = require("../controllers/newLogin");

route.post("/Login", (req, res) => {
  console.log("Logging in...");
  console.log(req.body);
  controller
    .login(req.body)
    .then((result) => {
      console.log(result);
      res.json(result); // Ensure result is sent as JSON
    })
    .catch((error) => {
      res.status(500).json({ message: "Server error", error });
    });
});
route.post("/cwdLogin", (req, res) => {
  console.log("Logging in...");
  console.log(req.body);
  controller
    .orgLogin(req.body)
    .then((result) => {
      console.log(result);
      res.json(result); // Ensure result is sent as JSON
    })
    .catch((error) => {
      res.status(500).json({ message: "Server error", error });
    });
});

module.exports = route;
