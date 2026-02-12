const mongoose = require("mongoose");

const testCaseSchema = new mongoose.Schema({
  input: String,
  output: String,
  hidden: {
    type: Boolean,
    default: false,
  }
});

const problemSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },

  description: {
    type: String,
    required: true,
  },

  inputFormat: String,

  outputFormat: String,

  difficulty: {
    type: String,
    enum: ["Easy", "Medium", "Hard"],
    default: "Easy",
  },

  points: {
    type: Number,
    default: 10,
  },

  testCases: [testCaseSchema],

}, {
  timestamps: true
});

module.exports = mongoose.model("Problem", problemSchema);
