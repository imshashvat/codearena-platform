const mongoose = require("mongoose");

const contestSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, default: "" },
  startTime: { type: Date, required: true },
  endTime: { type: Date, required: true },
  problems: [{ type: mongoose.Schema.Types.ObjectId, ref: "Problem" }],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  proctored: { type: Boolean, default: false },
  requireWebcam: { type: Boolean, default: false },
  requireScreen: { type: Boolean, default: false },
  requireMic: { type: Boolean, default: false },
  status: { type: String, enum: ["draft", "upcoming", "active", "ended"], default: "upcoming" },
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  maxParticipants: { type: Number, default: 0 }, // 0 = unlimited
  accessCode: { type: String, default: "" },      // optional invite code
}, { timestamps: true });

// Virtual: is the contest currently live?
contestSchema.virtual("isLive").get(function () {
  const now = new Date();
  return now >= this.startTime && now <= this.endTime;
});

module.exports = mongoose.model("Contest", contestSchema);
