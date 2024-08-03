const exp = require("express");
const route = exp.Router();
const controller = require("../controllers/Login");

module.exports = route;

route.post("/", (req, res) => {
  console.log(req.body);

  let acc_name = req.body.acc_name;
  let password = req.body.password;
  let usertype = req.body.usertype;
  let returnbody = {};

  if (acc_name && password) {
    controller.login(acc_name, password, usertype, returnbody).then((ok) => {
      if (!ok.error) {
        res.send(returnbody);
      } else {
        res.status(400).json({ error: ok.error });
      }
    });
  }
});
