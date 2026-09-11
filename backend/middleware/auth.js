import jwt from "jsonwebtoken";
import { User } from "../models/index.js";
import { ApiError, asyncHandler } from "../utils/http.js";
const tokenFrom = (req) => {
  const h = req.headers.authorization || "";
  return h.startsWith("Bearer ") ? h.slice(7) : null;
};
export const requireAuth = asyncHandler(async (req, _res, next) => {
  const token = tokenFrom(req);
  if (!token) throw new ApiError(401, "Authentication required.");
  let p;
  try {
    p = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    throw new ApiError(401, "Session expired or token is invalid.");
  }
  const user = await User.findById(p.sub).select("name email role active");
  if (!user || !user.active)
    throw new ApiError(401, "User account is unavailable.");
  req.user = user;
  next();
});
export const optionalAuth = asyncHandler(async (req, _res, next) => {
  const token = tokenFrom(req);
  if (token) {
    try {
      const p = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(p.sub).select("name email role active");
    } catch {
      req.user = null;
    }
  }
  next();
});
export const permit =
  (...roles) =>
  (req, _res, next) => {
    if (!req.user) return next(new ApiError(401, "Authentication required."));
    if (!roles.includes(req.user.role))
      return next(
        new ApiError(403, "You do not have permission to perform this action."),
      );
    next();
  };
