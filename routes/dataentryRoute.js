const exp = require("express");
const route = exp.Router();
const controller = require("../controllers/dataEntryStaff.js");
const auth = require("../middleware/Auth.js");

module.exports = route;

route.post("/uploadBills", async (req, res) => {
  try {
    console.log("Uploading Bills...", req.body);
    const billsData = req.body.bills; // Kunin ang JSON data na ipinapasa sa body

    if (!billsData || !Array.isArray(billsData)) {
      return res.status(400).json({
        message: "Invalid data format. Please upload an array of bills.",
      });
    }

    // Call the controller function to process the bills
    const result = await controller.UploadBills(req.body); // Use await here

    if (result.success) {
      return res.status(200).json(result);
    } else {
      return res.status(500).json(result);
    }
  } catch (err) {
    console.error(err); // Log the error for debugging
    res.status(500).json({ message: `Error uploading bills: ${err.message}` });
  }
});
route.get("/uploadHistory", (req, res) => {
  console.log("Getting Histories");
  controller.GetUploadHistory().then((result) => {
    res.send(result);
  });
});
