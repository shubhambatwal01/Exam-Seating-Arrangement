import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User } from "../models/index.js";
import { ApiError, ok } from "../utils/http.js";

function signToken(user) {
  if (!process.env.JWT_SECRET) throw new Error("JWT_SECRET is missing.");
  return jwt.sign(
    { sub: String(user._id), role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "8h" },
  );
}

export async function register(req, res) {
  const userCount = await User.countDocuments();
  if (userCount > 0 && req.user?.role !== "admin") {
    throw new ApiError(
      403,
      "After initial setup, only an admin can create accounts.",
    );
  }

  const { name, email, password, role = "staff" } = req.body;
  if (await User.exists({ email })) {
    throw new ApiError(409, "An account with this email already exists.");
  }

  const user = await User.create({
    name,
    email,
    passwordHash: await bcrypt.hash(password, 12),
    role: userCount === 0 ? "admin" : role,
  });

  return ok(
    res,
    {
      token: signToken(user),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    },
    userCount === 0 ? "Initial admin created." : "User created.",
    201,
  );
}

export async function login(req, res) {
  const { email, password } = req.body;
  const user = await User.findOne({ email }).select("+passwordHash");
  const valid =
    user?.active && (await bcrypt.compare(password, user.passwordHash));
  if (!valid) throw new ApiError(401, "Invalid email or password.");

  return ok(
    res,
    {
      token: signToken(user),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    },
    "Login successful.",
  );
}

export function me(req, res) {
  return ok(res, {
    id: req.user._id,
    name: req.user.name,
    email: req.user.email,
    role: req.user.role,
  });
}
