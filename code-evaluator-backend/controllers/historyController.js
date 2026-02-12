const Submission = require("../models/Submission");

// Get My Submissions
exports.getMySubmissions = async (req, res) => {
  try {

    const submissions = await Submission.find({
      user: req.user.id
    })
      .populate("problem", "title difficulty")
      .sort({ createdAt: -1 });

    res.json(submissions);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
