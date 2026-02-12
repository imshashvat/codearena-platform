const Submission = require("../models/Submission");
const { exec, spawn } = require("child_process");
const Problem = require("../models/Problem");

// Submit Code
exports.submitCode = async (req, res) => {
  try {
    const { problemId, code, language } = req.body;

    if (!problemId || !code) {
      return res.status(400).json({ message: "Missing fields" });
    }

    // Get problem
    const problem = await Problem.findById(problemId);

    if (!problem) {
      return res.status(404).json({ message: "Problem not found" });
    }

    const testCases = problem.testCases;

    let results = [];
    let passed = 0;

    // Run on each testcase
    for (let i = 0; i < testCases.length; i++) {

      const input = testCases[i].input;
      const expected = testCases[i].output.trim();

      const output = await runInDocker(code, input);

      const userOutput = output.trim();

      if (userOutput === expected) {

        passed++;

        results.push({
          testCase: i + 1,
          status: "Passed",
        });

      } else {

        results.push({
          testCase: i + 1,
          status: "Failed",
          expected,
          got: userOutput,
        });
      }
    }

    // Verdict
    const verdict =
      passed === testCases.length ? "Accepted" : "Wrong Answer";


    // ===============================
    // SAVE SUBMISSION (NEW PART)
    // ===============================
    await Submission.create({
      user: req.user.id,
      problem: problemId,
      code,
      verdict,
      passed,
      total: testCases.length,
    });


    // Send Response
    res.json({
      verdict,
      passed,
      total: testCases.length,
      results,
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({ error: error.message });
  }
};



// ===============================
// Run Code in Docker (UNCHANGED)
// ===============================

function runInDocker(code, input) {

  return new Promise((resolve) => {

    const docker = spawn("docker", [
      "run",
      "-i",
      "--rm",
      "codejudge",
      "python",
      "runner.py",
      input
    ]);

    let output = "";
    let error = "";

    // Send code through stdin
    docker.stdin.write(code);
    docker.stdin.end();

    docker.stdout.on("data", (data) => {
      output += data.toString();
    });

    docker.stderr.on("data", (data) => {
      error += data.toString();
    });

    docker.on("close", () => {

      if (error) {
        console.error("Docker error:", error);
        return resolve("Runtime Error");
      }

      resolve(output.trim());
    });
  });
}
