const Contest = require("../models/Contest");
const Problem = require("../models/Problem");
const Submission = require("../models/Submission");
const User = require("../models/User");

// ── List all contests ──────────────────────────────────────────────────────
exports.listContests = async (req, res) => {
  try {
    const now = new Date();
    const contests = await Contest.find()
      .populate("createdBy", "name")
      .populate("problems", "title difficulty points")
      .sort({ startTime: -1 });

    const enriched = contests.map(c => {
      const obj = c.toObject();
      const start = new Date(c.startTime);
      const end = new Date(c.endTime);
      if (now < start) obj.liveStatus = "upcoming";
      else if (now > end) obj.liveStatus = "ended";
      else obj.liveStatus = "active";
      obj.participantCount = c.participants.length;
      // Let the client know if the logged-in user already joined
      obj.isParticipant = c.participants.map(p => p.toString()).includes(req.user.id);
      return obj;
    });

    res.json(enriched);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


// ── Get single contest ─────────────────────────────────────────────────────
exports.getContest = async (req, res) => {
  try {
    const contest = await Contest.findById(req.params.id)
      .populate("createdBy", "name")
      .populate("problems", "_id title difficulty points description inputFormat outputFormat testCases");

    if (!contest) return res.status(404).json({ message: "Contest not found" });

    const now = new Date();
    const obj = contest.toObject();
    const start = new Date(contest.startTime);
    const end = new Date(contest.endTime);

    if (now < start) obj.liveStatus = "upcoming";
    else if (now > end) obj.liveStatus = "ended";
    else obj.liveStatus = "active";

    // Hide test case outputs for non-admins during active contest
    if (obj.liveStatus === "active" && req.user.role !== "admin") {
      obj.problems = obj.problems.map(p => ({
        ...p,
        testCases: p.testCases.filter(tc => !tc.hidden).map(tc => ({ input: tc.input }))
      }));
    }

    obj.isParticipant = contest.participants.map(p => p.toString()).includes(req.user.id);
    obj.participantCount = contest.participants.length;
    obj.serverTime = now;

    res.json(obj);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── Create contest (Admin) ─────────────────────────────────────────────────
exports.createContest = async (req, res) => {
  try {
    const {
      title, description, startTime, endTime,
      problems, proctored, requireWebcam, requireScreen, requireMic,
      maxParticipants, accessCode
    } = req.body;

    if (!title || !startTime || !endTime) {
      return res.status(400).json({ message: "Title, start time, and end time are required" });
    }
    if (new Date(endTime) <= new Date(startTime)) {
      return res.status(400).json({ message: "End time must be after start time" });
    }

    const contest = await Contest.create({
      title, description, startTime, endTime,
      problems: problems || [],
      createdBy: req.user.id,
      proctored: !!proctored,
      requireWebcam: !!requireWebcam,
      requireScreen: !!requireScreen,
      requireMic: !!requireMic,
      maxParticipants: maxParticipants || 0,
      accessCode: accessCode || "",
      status: "upcoming",
    });

    const populated = await Contest.findById(contest._id).populate("problems", "title difficulty points");
    res.status(201).json({ message: "Contest created", contest: populated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── Update contest (Admin) ─────────────────────────────────────────────────
exports.updateContest = async (req, res) => {
  try {
    const contest = await Contest.findByIdAndUpdate(req.params.id, req.body, { new: true })
      .populate("problems", "title difficulty points");
    if (!contest) return res.status(404).json({ message: "Contest not found" });
    res.json({ message: "Contest updated", contest });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── Delete contest (Admin) ─────────────────────────────────────────────────
exports.deleteContest = async (req, res) => {
  try {
    const contest = await Contest.findByIdAndDelete(req.params.id);
    if (!contest) return res.status(404).json({ message: "Contest not found" });
    res.json({ message: "Contest deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── Join contest ───────────────────────────────────────────────────────────
exports.joinContest = async (req, res) => {
  try {
    const contest = await Contest.findById(req.params.id);
    if (!contest) return res.status(404).json({ message: "Contest not found" });

    const now = new Date();
    if (now > new Date(contest.endTime)) {
      return res.status(400).json({ message: "This contest has already ended" });
    }

    // Check access code
    if (contest.accessCode && req.body.accessCode !== contest.accessCode) {
      return res.status(403).json({ message: "Invalid access code" });
    }

    // Check capacity
    if (contest.maxParticipants > 0 && contest.participants.length >= contest.maxParticipants) {
      return res.status(400).json({ message: "Contest is full" });
    }

    // Add participant if not already joined
    if (!contest.participants.map(p => p.toString()).includes(req.user.id)) {
      contest.participants.push(req.user.id);
      await contest.save();
    }

    res.json({ message: "Joined contest successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── Contest leaderboard ────────────────────────────────────────────────────
exports.contestLeaderboard = async (req, res) => {
  try {
    const contest = await Contest.findById(req.params.id).populate("participants", "name");
    if (!contest) return res.status(404).json({ message: "Contest not found" });

    const participantIds = contest.participants.map(p => p._id || p);
    const problemIds = contest.problems;

    // Only count submissions tagged with this contestId (in-contest solves)
    const submissions = await Submission.find({
      user:    { $in: participantIds },
      problem: { $in: problemIds },
      contest: contest._id,
      verdict: "Accepted",
    }).populate("problem", "points title");

    // Calculate scores (unique problems only — first-accepted counts)
    const scoreMap = {};
    const solvedMap = {};

    for (const sub of submissions) {
      const uid = sub.user.toString();
      const pid = sub.problem?._id?.toString();
      if (!pid) continue;
      if (!scoreMap[uid]) { scoreMap[uid] = 0; solvedMap[uid] = new Set(); }
      if (!solvedMap[uid].has(pid)) {
        scoreMap[uid] += sub.problem?.points || 0;
        solvedMap[uid].add(pid);
      }
    }

    const board = contest.participants
      .map(p => ({
        userId: p._id,
        name:   p.name,
        score:  scoreMap[p._id?.toString()] || 0,
        solved: solvedMap[p._id?.toString()]?.size || 0,
      }))
      .sort((a, b) => b.score - a.score || b.solved - a.solved)
      .map((e, i) => ({ ...e, rank: i + 1 }));

    res.json(board);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

