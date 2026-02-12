const mongoose = require("mongoose");

const submissionSchema = new mongoose.Schema({

  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  problem: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Problem",
    required: true
  },

  code: {
    type: String,
    required: true
  },

  verdict: {
    type: String,
    enum: ["Accepted", "Wrong Answer", "Runtime Error", "Time Limit Exceeded"],
    required: true
  },

  passed: {
    type: Number,
    required: true
  },

  total: {
    type: Number,
    required: true
  }

}, {
  timestamps: true
});

module.exports = mongoose.model("Submission", submissionSchema);
