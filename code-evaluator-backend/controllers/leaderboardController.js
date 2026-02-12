const Submission = require("../models/Submission");


// Get Leaderboard
exports.getLeaderboard = async (req, res) => {
  try {

    const leaderboard = await Submission.aggregate([

      // Only Accepted solutions
      {
        $match: { verdict: "Accepted" }
      },

      // Group by user
      {
        $group: {
          _id: "$user",

          solved: { $sum: 1 },

          submissions: { $sum: 1 },

          totalPoints: { $sum: "$total" }
        }
      },

      // Join with Users collection
      {
        $lookup: {
          from: "users",           // MongoDB collection name
          localField: "_id",
          foreignField: "_id",
          as: "user"
        }
      },

      // Convert user array to object
      {
        $unwind: "$user"
      },

      // Pick fields to show
      {
        $project: {
          _id: 0,

          userId: "$_id",

          name: "$user.name",      // from User model
          email: "$user.email",    // from User model

          solved: 1,
          submissions: 1,
          totalPoints: 1
        }
      },

      // Sort by points and solved
      {
        $sort: {
          totalPoints: -1,
          solved: -1
        }
      }

    ]);

    // Add rank
    leaderboard.forEach((user, index) => {
      user.rank = index + 1;
    });

    res.json(leaderboard);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
