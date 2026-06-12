const mongoose = require("mongoose");

const violationSchema = new mongoose.Schema({
  type: { type: String },
  message: { type: String },
  timestamp: { type: Date, default: Date.now },
}, { _id: false });

const submissionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  problem: { type: mongoose.Schema.Types.ObjectId, ref: "Problem", required: true },
  contest: { type: mongoose.Schema.Types.ObjectId, ref: "Contest", default: null },
  code: { type: String, required: true },
  language: { type: String, default: "python" },
  verdict: {
    type: String,
    enum: ["Accepted", "Wrong Answer", "Runtime Error", "Time Limit Exceeded", "Compilation Error", "Auto-Submitted"],
    required: true,
  },
  passed: { type: Number, required: true },
  total:  { type: Number, required: true },
  runtime: { type: Number, default: 0 },           // ms
  // Proctoring
  warnings:    { type: Number, default: 0 },
  autoSubmitted: { type: Boolean, default: false },
  violations:  { type: [violationSchema], default: [] },
}, { timestamps: true });

module.exports = mongoose.model("Submission", submissionSchema);
