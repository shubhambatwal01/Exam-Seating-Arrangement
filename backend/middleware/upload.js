import multer from "multer";
import { ApiError } from "../utils/http.js";
export const excelUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter(_req, file, cb) {
    if (!file.originalname.toLowerCase().endsWith(".xlsx"))
      return cb(new ApiError(400, "Only .xlsx Excel files are accepted."));
    cb(null, true);
  },
});
