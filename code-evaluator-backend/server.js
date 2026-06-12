const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/db");

dotenv.config();
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: "2mb" }));

// Routes
app.use("/api/auth",        require("./routes/authRoutes"));
app.use("/api/user",        require("./routes/userRoutes"));
app.use("/api/problems",    require("./routes/problemRoutes"));
app.use("/api/submit",      require("./routes/submissionRoutes"));
app.use("/api/history",     require("./routes/historyRoutes"));
app.use("/api/leaderboard", require("./routes/leaderboardRoutes"));
app.use("/api/contests",    require("./routes/contestRoutes"));
app.use("/api/admin",       require("./routes/adminRoutes"));

// Health check
app.get("/", (req, res) => res.send("🚀 CodeArena API Running"));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
