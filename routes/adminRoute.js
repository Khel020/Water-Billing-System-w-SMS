const exp = require("express");
const route = exp.Router();
const controller = require("../controllers/adminController.js");

module.exports = route;

//Get = For get
//Post= Add New Data
//Put = Update/Edit
//Delete = Delete
route.get("/admins",(req,res) => {
   console.log("Loading Admins")
   console.log(req.body);
   controller.GetAdmin(req.body).then(result=>{
        res.send(result)
   })
})
route.post("/add",(req,res)=>{
   console.log("Adding Admin Acc")
   console.log(req.body);
   controller.CreateAdmin(req.body).then(result=>{
        res.send(result)
   })
})
route.put("/editAdmin",(req,res) => {
   console.log("Updating Admin")
   console.log(req.body);
   controller.UpdateAdminByID(req.body).then(result=>{
       res.send(result)
   })
})