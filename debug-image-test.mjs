import fs from "fs";
import path from "path";
import sharp from "sharp";
import { processRecipeImages } from "./app/utils/recipe-image-processor.js";

const tmpDir = path.join(process.cwd(), "tmp-debug");
if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
const buffer = await sharp({
  create: { width: 1200, height: 680, channels: 3, background: "#ffffff" },
})
  .jpeg()
  .toBuffer();
const tempFile = path.join(tmpDir, "debug-169.jpg");
fs.writeFileSync(tempFile, buffer);
console.log("wrote", tempFile, "size", fs.statSync(tempFile).size);
try {
  const result = await processRecipeImages([
    {
      path: tempFile,
      originalname: "debug-169.jpg",
      filename: "debug-169.jpg",
      size: fs.statSync(tempFile).size,
    },
  ]);
  console.log("result", JSON.stringify(result, null, 2));
} catch (err) {
  console.error("process failed", err.message);
  console.error(err.stack);
}
