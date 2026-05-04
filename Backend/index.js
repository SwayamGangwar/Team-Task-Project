const path = require("path");
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

require("dotenv").config({ path: path.join(__dirname, ".env") });

const mongoUri = process.env.MONGO_URI;
const jwtSecret = process.env.JWT_SECRET;

if (!mongoUri || typeof mongoUri !== "string" || !mongoUri.trim()) {
  console.error(
    "Missing MONGO_URI. Create Backend/.env (see Backend/.env.example) and set MONGO_URI."
  );
  process.exit(1);
}
if (!jwtSecret || typeof jwtSecret !== "string" || !jwtSecret.trim()) {
  console.error(
    "Missing JWT_SECRET. Set JWT_SECRET in Backend/.env (any long random string for signing tokens)."
  );
  process.exit(1);
}

const app = express();

const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("API is running");
});

// Routes
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/project", require("./routes/projectRoutes"));
app.use("/api/task", require("./routes/taskRoutes"));
app.use("/api/dashboard", require("./routes/dashboardRoutes"));
app.use("/api/users", require("./routes/userRoutes"));

const { ensureBootstrapAdmin } = require("./config/bootstrapAdmin");

app.use(cors({
  origin: "*"
}));

mongoose
  .connect(mongoUri)
  .then(async () => {
    console.log("MongoDB Connected");
    await ensureBootstrapAdmin();
    app.listen(process.env.PORT || 5000, "0.0.0.0", () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => console.log(err));