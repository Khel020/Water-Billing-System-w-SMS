const exp = require("express");
const route = exp.Router();
const controller = require("../controllers/itController.js");
const auth = require("../middleware/Auth.js");

module.exports = route;

route.post("/addIT", (req, res) => {
  console.log("Adding IT Account");
  console.log("PassReq", req.body);
  controller.CreateITAccount(req.body).then((result) => {
    res.send(result);
  });
});
