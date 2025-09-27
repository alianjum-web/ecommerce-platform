// src/middleware/uploadMiddleware.ts
import multer from "multer";

// Use memory storage - NO local files
export const upload = multer({
  storage: multer.memoryStorage(), // Files stored as buffers in memory
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image")) {
      cb(null, true);
    } else {
      cb(new Error("Not an image! Please upload only images."));
    }
  },
  limits: { 
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 5 // Maximum 5 files
  },
});