const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const Submission = require("../models/Submission");
const Problem = require("../models/Problem");

// Heatmap: submissions grouped by date for last 365 days
router.get("/heatmap", auth, async (req, res) => {
  try {
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    const subs = await Submission.find({
      user: req.user.id,
      createdAt: { $gte: oneYearAgo },
    }).select("createdAt verdict");

    const map = {};
    for (const s of subs) {
      const day = s.createdAt.toISOString().slice(0, 10);
      if (!map[day]) map[day] = { total: 0, accepted: 0 };
      map[day].total++;
      if (s.verdict === "Accepted") map[day].accepted++;
    }

    res.json(map);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Detailed stats for dashboard
router.get("/stats", auth, async (req, res) => {
  try {
    const allSubs = await Submission.find({ user: req.user.id })
      .populate("problem", "difficulty points title")
      .sort({ createdAt: -1 });

    const accepted = allSubs.filter(s => s.verdict === "Accepted");
    const uniqueSolvedMap = {};
    for (const s of accepted) {
      const pid = s.problem?._id?.toString();
      if (pid && !uniqueSolvedMap[pid]) {
        uniqueSolvedMap[pid] = s.problem;
      }
    }
    const solvedProblems = Object.values(uniqueSolvedMap);

    const byDifficulty = { easy: 0, medium: 0, hard: 0 };
    for (const p of solvedProblems) {
      if (p.difficulty) byDifficulty[p.difficulty]++;
    }

    // Total problems available per difficulty
    const allProblems = await Problem.find().select("difficulty");
    const totalByDiff = { easy: 0, medium: 0, hard: 0 };
    for (const p of allProblems) { totalByDiff[p.difficulty]++; }

    // Language breakdown
    const langMap = {};
    for (const s of accepted) {
      langMap[s.language] = (langMap[s.language] || 0) + 1;
    }

    // Streak calculation
    const solvedDays = new Set(
      accepted.map(s => s.createdAt.toISOString().slice(0, 10))
    );
    let streak = 0;
    let maxStreak = 0;
    const today = new Date();
    for (let i = 0; i < 365; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      if (solvedDays.has(key)) {
        streak++;
        maxStreak = Math.max(maxStreak, streak);
      } else {
        if (i > 0) break; // streak broken
      }
    }

    // Acceptance rate
    const acceptanceRate = allSubs.length > 0
      ? Math.round((accepted.length / allSubs.length) * 100)
      : 0;

    res.json({
      totalSolved: solvedProblems.length,
      totalSubmissions: allSubs.length,
      acceptedSubmissions: accepted.length,
      acceptanceRate,
      byDifficulty,
      totalByDiff,
      totalProblems: allProblems.length,
      languageBreakdown: langMap,
      streak,
      maxStreak,
      recentSubmissions: allSubs.slice(0, 10),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/profile", auth, (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;
