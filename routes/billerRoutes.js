const exp = require("express");
const route = exp.Router();
const biller = require("../controllers/billmngrController");
const auth = require("../middleware/Auth");

module.exports = route;

route.post("/addBiller", (req, res) => {
  console.log("Adding Biller..");
  console.log(req.body);
  biller.CreateBillingMngr(req.body).then((result) => {
    res.send(result);
  });
});
