import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { body } from "express-validator";
import { User } from "../models/index.js";
import { optionalAuth, requireAuth } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { ApiError, asyncHandler, ok } from "../utils/http.js";

const router = Router();

function signToken(user) {
  if (!process.env.JWT_SECRET) throw new Error("JWT_SECRET is missing.");
  return jwt.sign(
    { sub: String(user._id), role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "8h" },
  );
}

router.post(
  "/register",
  optionalAuth,
  [
    body("name").trim().notEmpty().withMessage("Name is required."),
    body("email")
      .isEmail()
      .withMessage("A valid email is required.")
      .normalizeEmail(),
    body("password")
      .isLength({ min: 8, max: 128 })
      .withMessage("Password must be 8-128 characters."),
    body("role")
      .optional()
      .isIn(["admin", "staff"])
      .withMessage("Role must be admin or staff."),
  ],
  validate,
  asyncHandler(async (req, res) => {
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

    ok(
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
  }),
);

router.post(
  "/login",
  [
    body("email")
      .isEmail()
      .withMessage("A valid email is required.")
      .normalizeEmail(),
    body("password").isString().notEmpty().withMessage("Password is required."),
  ],
  validate,
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select("+passwordHash");
    const valid =
      user?.active && (await bcrypt.compare(password, user.passwordHash));
    if (!valid) throw new ApiError(401, "Invalid email or password.");

    ok(
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
  }),
);

router.get("/me", requireAuth, (req, res) =>
  ok(res, {
    id: req.user._id,
    name: req.user.name,
    email: req.user.email,
    role: req.user.role,
  }),
);

export default router;
