const express = require("express");
const router = express.Router();

const { getMySubmissions } = require("../controllers/historyController");
const auth = require("../middleware/auth");

router.get("/", auth, getMySubmissions);

module.exports = router;
