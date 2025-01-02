const express = require("express");
const route = express.Router();
const controller = require("../middleware/Auth.js");

route.post("/tokenCheck", (req, res) => {
  console.log("Checking token...");
  console.log(req.headers.authorization);
  controller
    .Validation(req, res)
    .then((result) => {
      console.log(result);
      res.json(result); // Ensure result is sent as JSON
    })
    .catch((error) => {
      res.status(500).json({ message: "Server error", error });
    });
});
module.exports = route;
