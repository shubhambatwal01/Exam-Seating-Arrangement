const express = require("express");
const asyncHandler = require("../middleware/asyncHandler");
const Holiday = require("../models/holiday");

const router = express.Router();

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const holidays = await Holiday.find().sort({ date: 1 });
    res.json(holidays);
  }),
);

router.post(
  "/",
  asyncHandler(async (req, res) => {
    const { date, reason } = req.body;
    if (!date || !reason) {
      res.status(400);
      throw new Error("Both date and reason are required");
    }

    const holiday = await Holiday.create({ date, reason });
    res.status(201).json(holiday);
  }),
);

router.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const holiday = await Holiday.findByIdAndDelete(req.params.id);
    if (!holiday) {
      res.status(404);
      throw new Error("Holiday not found");
    }
    res.json({ message: "Holiday deleted" });
  }),
);

module.exports = router;
