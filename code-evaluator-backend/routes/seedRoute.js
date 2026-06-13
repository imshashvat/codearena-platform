const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Problem = require("../models/Problem");
const User = require("../models/User");

const problems = [
  {
    title: "Two Sum",
    description: `Given an array of integers \`nums\` and an integer \`target\`, return indices of the two numbers such that they add up to \`target\`.

You may assume that each input would have exactly one solution, and you may not use the same element twice.

**Example:**
\`\`\`
Input: nums = [2,7,11,15], target = 9
Output: [0,1]
Explanation: nums[0] + nums[1] = 2 + 7 = 9
\`\`\``,
    inputFormat: "First line: space-separated integers (the array)\nSecond line: target integer",
    outputFormat: "Two space-separated integers (0-indexed positions)",
    difficulty: "easy",
    points: 10,
    testCases: [
      { input: "2 7 11 15\n9", output: "0 1", hidden: false },
      { input: "3 2 4\n6", output: "1 2", hidden: false },
      { input: "3 3\n6", output: "0 1", hidden: true },
    ],
  },
  {
    title: "Reverse a String",
    description: `Write a program to reverse a given string.

**Example:**
\`\`\`
Input: hello
Output: olleh
\`\`\``,
    inputFormat: "A single line containing the string to reverse",
    outputFormat: "The reversed string",
    difficulty: "easy",
    points: 10,
    testCases: [
      { input: "hello", output: "olleh", hidden: false },
      { input: "abcde", output: "edcba", hidden: false },
      { input: "racecar", output: "racecar", hidden: true },
    ],
  },
  {
    title: "FizzBuzz",
    description: `Given an integer \`n\`, print numbers from 1 to n with the following rules:
- If divisible by 3, print "Fizz"
- If divisible by 5, print "Buzz"
- If divisible by both 3 and 5, print "FizzBuzz"
- Otherwise, print the number

**Example:**
\`\`\`
Input: 5
Output:
1
2
Fizz
4
Buzz
\`\`\``,
    inputFormat: "A single integer n",
    outputFormat: "n lines with the appropriate output per number",
    difficulty: "easy",
    points: 15,
    testCases: [
      { input: "5", output: "1\n2\nFizz\n4\nBuzz", hidden: false },
      { input: "15", output: "1\n2\nFizz\n4\nBuzz\nFizz\n7\n8\nFizz\nBuzz\n11\nFizz\n13\n14\nFizzBuzz", hidden: true },
    ],
  },
  {
    title: "Maximum Subarray",
    description: `Given an integer array \`nums\`, find the subarray with the largest sum and return its sum.

**Example:**
\`\`\`
Input: -2 1 -3 4 -1 2 1 -5 4
Output: 6
Explanation: The subarray [4,-1,2,1] has the largest sum = 6.
\`\`\``,
    inputFormat: "A single line of space-separated integers",
    outputFormat: "A single integer — the maximum subarray sum",
    difficulty: "medium",
    points: 25,
    testCases: [
      { input: "-2 1 -3 4 -1 2 1 -5 4", output: "6", hidden: false },
      { input: "1", output: "1", hidden: false },
      { input: "5 4 -1 7 8", output: "23", hidden: true },
    ],
  },
  {
    title: "Valid Parentheses",
    description: `Given a string \`s\` containing just the characters \`(\`, \`)\`, \`{\`, \`}\`, \`[\` and \`]\`, determine if the input string is valid.

A string is valid if:
1. Open brackets must be closed by the same type of brackets.
2. Open brackets must be closed in the correct order.

**Example:**
\`\`\`
Input: ()[]{}
Output: true

Input: (]
Output: false
\`\`\``,
    inputFormat: "A single string of bracket characters",
    outputFormat: "true or false",
    difficulty: "medium",
    points: 20,
    testCases: [
      { input: "()", output: "true", hidden: false },
      { input: "()[]{}", output: "true", hidden: false },
      { input: "(]", output: "false", hidden: false },
      { input: "([)]", output: "false", hidden: true },
      { input: "{[]}", output: "true", hidden: true },
    ],
  },
  {
    title: "Merge Sort",
    description: `Implement merge sort and sort the given array of integers in ascending order.

**Example:**
\`\`\`
Input: 5 3 8 4 2
Output: 2 3 4 5 8
\`\`\``,
    inputFormat: "A single line of space-separated integers",
    outputFormat: "The sorted integers, space-separated",
    difficulty: "medium",
    points: 30,
    testCases: [
      { input: "5 3 8 4 2", output: "2 3 4 5 8", hidden: false },
      { input: "1", output: "1", hidden: false },
      { input: "9 7 5 3 1 2 4 6 8", output: "1 2 3 4 5 6 7 8 9", hidden: true },
    ],
  },
  {
    title: "Longest Common Subsequence",
    description: `Given two strings \`text1\` and \`text2\`, return the length of their longest common subsequence. If there is no common subsequence, return 0.

**Example:**
\`\`\`
Input:
abcde
ace
Output: 3
Explanation: The LCS is "ace" with length 3.
\`\`\``,
    inputFormat: "Two lines, each containing a string",
    outputFormat: "A single integer — the length of the LCS",
    difficulty: "hard",
    points: 50,
    testCases: [
      { input: "abcde\nace", output: "3", hidden: false },
      { input: "abc\nabc", output: "3", hidden: false },
      { input: "abc\ndef", output: "0", hidden: true },
    ],
  },
  {
    title: "N-Queens",
    description: `Place N queens on an N×N chessboard such that no two queens attack each other. Return the total number of distinct solutions.

**Example:**
\`\`\`
Input: 4
Output: 2
\`\`\``,
    inputFormat: "A single integer N",
    outputFormat: "A single integer — the number of distinct solutions",
    difficulty: "hard",
    points: 75,
    testCases: [
      { input: "4", output: "2", hidden: false },
      { input: "1", output: "1", hidden: false },
      { input: "8", output: "92", hidden: true },
    ],
  },
];

// POST /api/seed  — protected by SEED_SECRET header
router.post("/", async (req, res) => {
  const secret = req.headers["x-seed-secret"];
  const expectedSecret = process.env.SEED_SECRET || "temporary-seed-secret-123";
  if (!secret || secret !== expectedSecret) {
    return res.status(403).json({ error: "Forbidden" });
  }

  try {
    const results = {};

    // Seed problems
    const existingCount = await Problem.countDocuments();
    if (existingCount === 0) {
      await Problem.insertMany(problems);
      results.problems = `✅ Seeded ${problems.length} problems`;
    } else {
      results.problems = `ℹ️ Problems already exist (${existingCount} found). Skipped.`;
    }

    // Promote admin
    const adminEmail = process.env.ADMIN_EMAIL || "shashvatt68@gmail.com";
    const user = await User.findOneAndUpdate(
      { email: adminEmail },
      { role: "admin" },
      { new: true }
    );

    if (user) {
      results.admin = `✅ Promoted ${user.email} to admin`;
    } else {
      results.admin = `⚠️ User ${adminEmail} not found — register first`;
    }

    res.json({ success: true, results });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
