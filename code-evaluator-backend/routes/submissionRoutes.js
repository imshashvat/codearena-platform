const express = require("express");
const router = express.Router();

const { submitCode } = require("../controllers/submissionController");
const auth = require("../middleware/auth");

// Submit solution
router.post("/", auth, submitCode);

module.exports = router;
