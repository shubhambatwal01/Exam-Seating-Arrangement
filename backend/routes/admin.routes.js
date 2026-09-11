import { Router } from "express";
import bcrypt from "bcryptjs";
import {
  Classroom,
  ExamSession,
  SeatingArrangement,
  Student,
  Timetable,
  User,
} from "../models/index.js";
import { permit, requireAuth } from "../middleware/auth.js";
import { ApiError, asyncHandler, ok } from "../utils/http.js";

const router = Router();
router.use(requireAuth);

router.get(
  "/dashboard",
  asyncHandler(async (_req, res) => {
    const [
      freshStudents,
      backlogStudents,
      totalClassrooms,
      activeExamSessions,
      upcomingExams,
    ] = await Promise.all([
      Student.countDocuments({ active: true, type: "fresh" }),
      Student.countDocuments({ active: true, type: "backlog" }),
      Classroom.countDocuments({ active: true }),
      ExamSession.countDocuments({ status: "active" }),
      Timetable.countDocuments({ date: { $gte: new Date() } }),
    ]);

    const utilizedClassroomIds = await SeatingArrangement.distinct("classroom");

    const departmentDistribution = await Student.aggregate([
      { $match: { active: true } },
      { $group: { _id: "$department", count: { $sum: 1 } } },
      {
        $lookup: {
          from: "departments",
          localField: "_id",
          foreignField: "_id",
          as: "department",
        },
      },
      { $unwind: "$department" },
      { $project: { _id: 0, name: "$department.code", count: 1 } },
      { $sort: { name: 1 } },
    ]);

    const semesterDistribution = await Student.aggregate([
      { $match: { active: true } },
      { $group: { _id: "$semester", count: { $sum: 1 } } },
      {
        $lookup: {
          from: "semesters",
          localField: "_id",
          foreignField: "_id",
          as: "semester",
        },
      },
      { $unwind: "$semester" },
      {
        $project: {
          _id: 0,
          name: { $concat: ["Sem ", { $toString: "$semester.number" }] },
          count: 1,
        },
      },
      { $sort: { name: 1 } },
    ]);

    ok(res, {
      stats: {
        totalStudents: freshStudents + backlogStudents,
        freshStudents,
        backlogStudents,
        upcomingExams,
        classroomsUtilized: utilizedClassroomIds.length,
        totalClassrooms,
        activeExamSessions,
      },
      departmentDistribution,
      semesterDistribution,
    });
  }),
);

router.get(
  "/users",
  permit("admin"),
  asyncHandler(async (_req, res) => {
    const users = await User.find()
      .select("name email role active createdAt")
      .sort({ createdAt: -1 })
      .lean();
    ok(res, users);
  }),
);

router.post(
  "/users",
  permit("admin"),
  asyncHandler(async (req, res) => {
    const { name, email, password, role = "staff" } = req.body;
    if (!name || !email || !password || password.length < 8) {
      throw new ApiError(
        422,
        "Name, valid email and password of at least 8 characters are required.",
      );
    }
    if (!["admin", "staff"].includes(role))
      throw new ApiError(422, "Invalid role.");
    if (await User.exists({ email: String(email).toLowerCase().trim() })) {
      throw new ApiError(409, "A user with this email already exists.");
    }

    const user = await User.create({
      name,
      email,
      passwordHash: await bcrypt.hash(password, 12),
      role,
    });
    ok(
      res,
      {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        active: user.active,
      },
      "User created.",
      201,
    );
  }),
);

router.patch(
  "/users/:id",
  permit("admin"),
  asyncHandler(async (req, res) => {
    const patch = {};
    for (const key of ["name", "role", "active"]) {
      if (req.body[key] !== undefined) patch[key] = req.body[key];
    }
    if (req.body.role && !["admin", "staff"].includes(req.body.role)) {
      throw new ApiError(422, "Invalid role.");
    }
    if (req.body.password) {
      if (req.body.password.length < 8)
        throw new ApiError(422, "Password must be at least 8 characters.");
      patch.passwordHash = await bcrypt.hash(req.body.password, 12);
    }

    const user = await User.findByIdAndUpdate(req.params.id, patch, {
      new: true,
      runValidators: true,
    }).select("name email role active");
    if (!user) throw new ApiError(404, "User not found.");

    ok(res, user, "User updated.");
  }),
);

export default router;
