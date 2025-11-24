import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration du stockage pour les films
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Les images seront stockées dans app/public/images/movies
    const uploadPath = path.join(__dirname, "../public/images/movies");
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // Génération d'un nom de fichier unique
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    const nameWithoutExt = path.basename(file.originalname, ext);
    cb(null, "movie-" + nameWithoutExt + "-" + uniqueSuffix + ext);
  },
});

// Filtre pour accepter uniquement les images
const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Format de fichier non supporté. Utilisez JPG, JPEG, PNG ou WEBP."
      ),
      false
    );
  }
};

// Configuration de Multer pour les films
const uploadMovie = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // Limite de 5 MB
  },
});

export default uploadMovie;
