const Submission = require("../models/Submission");
const { spawn, execSync } = require("child_process");
const path = require("path");
const fs = require("fs");
const os = require("os");
const Problem = require("../models/Problem");

// ===============================
// Language Configuration
// ===============================
const LANGUAGE_CONFIG = {
  python: {
    extension: ".py",
    monacoId: "python",
    compiled: false,
    // Use 'py' on Windows, 'python3' on Linux/Mac
    run: (file) => ({ bin: process.platform === "win32" ? "py" : "python3", args: [file] }),
  },
  javascript: {
    extension: ".js",
    monacoId: "javascript",
    compiled: false,
    run: (file) => ({ bin: "node", args: [file] }),
  },
  c: {
    extension: ".c",
    monacoId: "c",
    compiled: true,
    compile: (srcFile, outFile) => ({
      bin: "gcc",
      args: [srcFile, "-o", outFile, "-O2", "-lm", "-Wall"],
    }),
    run: (outFile) => ({ bin: outFile, args: [] }),
  },
  cpp: {
    extension: ".cpp",
    monacoId: "cpp",
    compiled: true,
    compile: (srcFile, outFile) => ({
      bin: "g++",
      args: [srcFile, "-o", outFile, "-O2", "-std=c++17", "-lm"],
    }),
    run: (outFile) => ({ bin: outFile, args: [] }),
  },
  java: {
    extension: ".java",
    monacoId: "java",
    compiled: true,
    // Special: needs class name extracted from code
    compile: (srcFile, classDir) => ({
      bin: "javac",
      args: ["-d", classDir, srcFile],
    }),
    run: (classDir, className) => ({
      bin: "java",
      args: ["-cp", classDir, "-Xmx256m", "-Xss64m", className],
    }),
  },
};

const COMPILE_TIMEOUT_MS = 12000; // 12 seconds to compile
const RUN_TIMEOUT_MS = 5000;      // 5 seconds to run

// ===============================
// Submit Code Endpoint
// ===============================
exports.submitCode = async (req, res) => {
  try {
    const { problemId, code, language, runMode } = req.body;

    if (!problemId || !code) {
      return res.status(400).json({ message: "Missing fields" });
    }

    const lang = (language || "python").toLowerCase();
    const config = LANGUAGE_CONFIG[lang];

    if (!config) {
      return res.status(400).json({
        message: `Language '${lang}' is not supported. Supported: ${Object.keys(LANGUAGE_CONFIG).join(", ")}`,
      });
    }

    // Get problem + test cases
    const problem = await Problem.findById(problemId);
    if (!problem) {
      return res.status(404).json({ message: "Problem not found" });
    }

    let testCases = problem.testCases;
    if (runMode === "run") {
      const sampleCases = testCases.filter((tc) => !tc.hidden);
      testCases = sampleCases.length > 0 ? sampleCases : testCases.slice(0, 2);
    }

    if (testCases.length === 0) {
      return res.status(400).json({ message: "No test cases found for this problem" });
    }

    // --- For compiled languages: compile ONCE, then run against all test cases ---
    let compiledArtifact = null; // path to binary or class dir
    let compileError = null;

    if (config.compiled) {
      const compileResult = await compileCode(code, lang, config);
      if (compileResult.error) {
        compileError = compileResult.error;
      } else {
        compiledArtifact = compileResult.artifact;
      }
    }

    // If compilation failed, all test cases fail immediately
    if (compileError) {
      const results = testCases.map((_, i) => ({
        testCase: i + 1,
        status: `Compilation Error`,
        compileError: compileError,
        expected: "",
        got: "",
      }));

      return res.json({
        verdict: "Compilation Error",
        passed: 0,
        total: testCases.length,
        results,
        compileError,
      });
    }

    // --- Run test cases ---
    let results = [];
    let passed = 0;

    for (let i = 0; i < testCases.length; i++) {
      const input = testCases[i].input || "";
      const expected = (testCases[i].output || "").trim();

      const output = config.compiled
        ? await runCompiled(compiledArtifact, lang, input, config)
        : await runInterpreted(code, lang, input, config);

      const userOutput = output.trim();
      const isCorrect = userOutput === expected;
      if (isCorrect) passed++;

      const statusLabel = isCorrect
        ? "Passed"
        : userOutput.startsWith("Error: Time Limit Exceeded")
        ? "Time Limit Exceeded"
        : userOutput.startsWith("Error: Runtime")
        ? "Runtime Error"
        : userOutput.startsWith("Error:")
        ? userOutput
        : "Wrong Answer";

      results.push({
        testCase: i + 1,
        status: statusLabel,
        expected,
        got: userOutput,
      });
    }

    // Cleanup compiled artifacts
    if (compiledArtifact) {
      try {
        if (lang === "java") {
          // Remove class dir
          fs.rmSync(compiledArtifact.classDir, { recursive: true, force: true });
        } else {
          fs.unlinkSync(compiledArtifact.binFile);
        }
      } catch (_) {}
    }

    // Determine verdict
    const allTLE = results.every(r => r.status === "Time Limit Exceeded");
    const allRTE = results.every(r => r.status === "Runtime Error");
    const verdict =
      passed === testCases.length
        ? "Accepted"
        : allTLE
        ? "Time Limit Exceeded"
        : allRTE
        ? "Runtime Error"
        : "Wrong Answer";

    // Save submission (only on full submit or auto-submit)
    if (runMode !== "run") {
      const { contestId, warnings, violations, autoSubmitted } = req.body;
      await Submission.create({
        user: req.user.id,
        problem: problemId,
        contest: contestId || null,
        code,
        language: lang,
        verdict: autoSubmitted ? "Auto-Submitted" : verdict,
        passed,
        total: testCases.length,
        warnings: warnings || 0,
        autoSubmitted: !!autoSubmitted,
        violations: violations || [],
      });
    }

    res.json({ verdict, passed, total: testCases.length, results });

  } catch (error) {
    console.error("Submit error:", error);
    res.status(500).json({ error: error.message });
  }
};


// ===============================
// Compile Phase (C, C++, Java)
// ===============================
async function compileCode(code, lang, config) {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "codearena_"));

  try {
    if (lang === "java") {
      // Extract public class name from code
      const classMatch = code.match(/public\s+class\s+(\w+)/);
      const className = classMatch ? classMatch[1] : "Solution";

      const srcFile = path.join(tmpDir, `${className}.java`);
      fs.writeFileSync(srcFile, code, "utf8");

      const classDir = path.join(tmpDir, "classes");
      fs.mkdirSync(classDir, { recursive: true });

      const compileCmd = config.compile(srcFile, classDir);
      const compileResult = await spawnProcess(
        compileCmd.bin,
        compileCmd.args,
        "",
        COMPILE_TIMEOUT_MS
      );

      if (compileResult.stderr && !compileResult.stdout) {
        // cleanup src
        try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch (_) {}
        return { error: compileResult.stderr.trim() };
      }

      return { artifact: { classDir, className, tmpDir } };

    } else {
      // C or C++
      const srcFile = path.join(tmpDir, `solution${config.extension}`);
      // On Linux/Mac, no .exe extension needed
      const binFile = path.join(tmpDir, process.platform === "win32" ? "solution.exe" : "solution");
      fs.writeFileSync(srcFile, code, "utf8");

      const compileCmd = config.compile(srcFile, binFile);
      const compileResult = await spawnProcess(
        compileCmd.bin,
        compileCmd.args,
        "",
        COMPILE_TIMEOUT_MS
      );

      if (compileResult.exitCode !== 0 || (compileResult.stderr && !fs.existsSync(binFile))) {
        try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch (_) {}
        return { error: compileResult.stderr.trim() || "Compilation failed" };
      }

      return { artifact: { binFile, tmpDir } };
    }
  } catch (err) {
    try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch (_) {}
    return { error: err.message };
  }
}


// ===============================
// Run Compiled Binary
// ===============================
async function runCompiled(artifact, lang, input, config) {
  try {
    let cmd;
    if (lang === "java") {
      cmd = config.run(artifact.classDir, artifact.className);
    } else {
      cmd = config.run(artifact.binFile);
    }

    const result = await spawnProcess(cmd.bin, cmd.args, input, RUN_TIMEOUT_MS);

    if (result.timedOut) return "Error: Time Limit Exceeded";
    if (result.exitCode !== 0 && result.stderr) {
      const cleanErr = result.stderr.split("\n").filter(l => l.trim()).slice(0, 3).join(" | ");
      return `Error: Runtime Error — ${cleanErr}`;
    }
    return result.stdout;
  } catch (err) {
    if (err.code === "ENOENT") return `Error: Executable not found — ${err.message}`;
    return `Error: ${err.message}`;
  }
}


// ===============================
// Run Interpreted (Python, JS)
// ===============================
async function runInterpreted(code, lang, input, config) {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "codearena_"));
  const srcFile = path.join(tmpDir, `solution${config.extension}`);

  try {
    fs.writeFileSync(srcFile, code, "utf8");
    const cmd = config.run(srcFile);
    const result = await spawnProcess(cmd.bin, cmd.args, input, RUN_TIMEOUT_MS);

    if (result.timedOut) return "Error: Time Limit Exceeded";
    if (result.exitCode !== 0 && result.stderr && !result.stdout) {
      const cleanErr = result.stderr.split("\n").filter(l => l.trim()).slice(0, 5).join("\n");
      return `Error: ${cleanErr}`;
    }
    return result.stdout;
  } catch (err) {
    if (err.code === "ENOENT") {
      return `Error: '${config.run(srcFile).bin}' is not installed or not in PATH`;
    }
    return `Error: ${err.message}`;
  } finally {
    try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch (_) {}
  }
}


// ===============================
// Core Spawn Helper
// ===============================
function spawnProcess(bin, args, input, timeoutMs) {
  return new Promise((resolve) => {
    let stdout = "";
    let stderr = "";
    let timedOut = false;
    let settled = false;

    const child = spawn(bin, args, {
      stdio: ["pipe", "pipe", "pipe"],
      windowsHide: true,
    });

    const timer = setTimeout(() => {
      timedOut = true;
      try { child.kill("SIGKILL"); } catch (_) {}
    }, timeoutMs);

    if (input) {
      try {
        child.stdin.write(input);
      } catch (_) {}
    }
    try { child.stdin.end(); } catch (_) {}

    child.stdout.on("data", (d) => { stdout += d.toString(); });
    child.stderr.on("data", (d) => { stderr += d.toString(); });

    child.on("close", (exitCode) => {
      clearTimeout(timer);
      if (!settled) {
        settled = true;
        resolve({ stdout: stdout.trim(), stderr: stderr.trim(), exitCode, timedOut });
      }
    });

    child.on("error", (err) => {
      clearTimeout(timer);
      if (!settled) {
        settled = true;
        resolve({ stdout: "", stderr: err.message, exitCode: -1, timedOut: false, error: err });
      }
    });
  });
}
