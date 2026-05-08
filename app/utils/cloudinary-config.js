import { v2 as cloudinary } from "cloudinary";

// Configuration Cloudinary depuis les variables d'environnement
// Les clés sont injectées par Render Dashboard en production
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export default cloudinary;
