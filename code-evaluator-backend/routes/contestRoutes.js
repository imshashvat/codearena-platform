const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const {
  listContests,
  getContest,
  createContest,
  updateContest,
  deleteContest,
  joinContest,
  contestLeaderboard,
} = require("../controllers/contestController");

router.get("/", auth, listContests);
router.get("/:id", auth, getContest);
router.post("/", auth, createContest);
router.put("/:id", auth, updateContest);
router.delete("/:id", auth, deleteContest);
router.post("/:id/join", auth, joinContest);
router.get("/:id/leaderboard", auth, contestLeaderboard);

module.exports = router;
