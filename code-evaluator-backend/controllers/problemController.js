const Problem = require("../models/Problem");

// Create Problem (Admin)
exports.createProblem = async (req, res) => {
  try {
    const problem = await Problem.create(req.body);

    res.status(201).json({
      message: "Problem created",
      problem
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get All Problems (Student)
exports.getProblems = async (req, res) => {
  try {
    const problems = await Problem.find().select("-testCases.output");

    res.json(problems);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get Single Problem
exports.getProblemById = async (req, res) => {
  try {
    const problem = await Problem.findById(req.params.id);

    if (!problem) {
      return res.status(404).json({ message: "Problem not found" });
    }

    res.json(problem);

  } catch (error) {
    res.status(404).json({ message: "Problem not found" });
  }
};

// Delete Problem (Admin)
exports.deleteProblem = async (req, res) => {
  try {
    const problem = await Problem.findByIdAndDelete(req.params.id);

    if (!problem) {
      return res.status(404).json({ message: "Problem not found" });
    }

    res.json({ message: "Problem deleted successfully" });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
