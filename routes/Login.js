const express = require("express");
const route = express.Router();
const controller = require("../controllers/newLogin");

route.post("/newLogin", (req, res) => {
  console.log("Logging in...");
  console.log(req.body);
  controller
    .login(req.body)
    .then((result) => {
      res.json(result); // Ensure result is sent as JSON
    })
    .catch((error) => {
      res.status(500).json({ message: "Server error", error });
    });
});

module.exports = route;
