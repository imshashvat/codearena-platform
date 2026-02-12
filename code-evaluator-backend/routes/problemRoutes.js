const express = require("express");
const router = express.Router();

const {
  createProblem,
  getProblems,
  getProblemById
} = require("../controllers/problemController");

const auth = require("../middleware/auth");

// Admin creates problem
router.post("/", auth, createProblem);

// Get all problems
router.get("/", auth, getProblems);

// Get single problem
router.get("/:id", auth, getProblemById);

module.exports = router;
