const User = require("../models/User");
const Submission = require("../models/Submission");
const Problem = require("../models/Problem");
const Contest = require("../models/Contest");

// ── Platform stats ─────────────────────────────────────────────────────────
exports.getPlatformStats = async (req, res) => {
  try {
    const [totalUsers, totalProblems, totalSubmissions, totalContests, acceptedSubmissions] = await Promise.all([
      User.countDocuments(),
      Problem.countDocuments(),
      Submission.countDocuments(),
      Contest.countDocuments(),
      Submission.countDocuments({ verdict: "Accepted" }),
    ]);

    const acceptanceRate = totalSubmissions > 0
      ? Math.round((acceptedSubmissions / totalSubmissions) * 100)
      : 0;

    // Submissions per day (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentActivity = await Submission.aggregate([
      { $match: { createdAt: { $gte: sevenDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Language distribution
    const langDist = await Submission.aggregate([
      { $group: { _id: "$language", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    res.json({
      totalUsers,
      totalProblems,
      totalSubmissions,
      totalContests,
      acceptedSubmissions,
      acceptanceRate,
      recentActivity,
      langDist,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── List all users ─────────────────────────────────────────────────────────
exports.listUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password").sort({ createdAt: -1 });

    // Enrich with submission counts
    const userIds = users.map(u => u._id);
    const submissionCounts = await Submission.aggregate([
      { $match: { user: { $in: userIds } } },
      { $group: { _id: "$user", total: { $sum: 1 }, accepted: { $sum: { $cond: [{ $eq: ["$verdict", "Accepted"] }, 1, 0] } } } },
    ]);

    const countMap = {};
    for (const sc of submissionCounts) {
      countMap[sc._id.toString()] = { total: sc.total, accepted: sc.accepted };
    }

    const enriched = users.map(u => ({
      ...u.toObject(),
      submissionCount: countMap[u._id.toString()]?.total || 0,
      acceptedCount: countMap[u._id.toString()]?.accepted || 0,
    }));

    res.json(enriched);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── Change user role ───────────────────────────────────────────────────────
exports.changeUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    if (!["student", "admin"].includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }
    const user = await User.findByIdAndUpdate(
      req.params.userId,
      { role },
      { new: true }
    ).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ message: `User promoted to ${role}`, user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── Delete user ────────────────────────────────────────────────────────────
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.userId);
    if (!user) return res.status(404).json({ message: "User not found" });
    await Submission.deleteMany({ user: req.params.userId });
    res.json({ message: "User deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
