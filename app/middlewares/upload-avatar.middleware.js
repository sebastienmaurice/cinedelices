import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { createFileFilter, MAX_FILE_SIZE } from "../utils/upload-config.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, "../public/images/profiles");
    fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    const nameWithoutExt = path.basename(file.originalname, ext);
    cb(null, `profile-${nameWithoutExt}-${uniqueSuffix}${ext}`);
  },
});

const uploadAvatar = multer({
  storage,
  fileFilter: createFileFilter(),
  limits: {
    fileSize: MAX_FILE_SIZE,
  },
});

export default uploadAvatar;
