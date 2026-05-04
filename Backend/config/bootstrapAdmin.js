const bcrypt = require("bcrypt");
const User = require("../models/User");

/** Reserved system admin — override via env in production. */
const BOOTSTRAP_ADMIN_EMAIL = (
  process.env.BOOTSTRAP_ADMIN_EMAIL || "admin@teamtask.local"
)
  .trim()
  .toLowerCase();

const BOOTSTRAP_ADMIN_PASSWORD =
  process.env.BOOTSTRAP_ADMIN_PASSWORD || "Admin@12345";

const BOOTSTRAP_ADMIN_NAME =
  process.env.BOOTSTRAP_ADMIN_NAME || "System Administrator";

async function ensureBootstrapAdmin() {
  const existing = await User.findOne({ email: BOOTSTRAP_ADMIN_EMAIL });
  if (existing) return;

  const hashedPassword = await bcrypt.hash(BOOTSTRAP_ADMIN_PASSWORD, 10);
  await User.create({
    name: BOOTSTRAP_ADMIN_NAME,
    email: BOOTSTRAP_ADMIN_EMAIL,
    password: hashedPassword,
    role: "admin",
  });
  console.log(
    `Bootstrap admin created: ${BOOTSTRAP_ADMIN_EMAIL} (set BOOTSTRAP_* in .env to customize).`
  );
}

module.exports = {
  ensureBootstrapAdmin,
  BOOTSTRAP_ADMIN_EMAIL,
};
