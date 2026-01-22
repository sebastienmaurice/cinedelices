import fs from "fs";
import path from "path";

const ROOT = process.cwd();
const sourcePath = path.join(ROOT, "app/public/js/confirm-modal.js");
const outputPath = path.join(
  ROOT,
  "docs/SEB le Fourbe/09-DOCS-PEDAGOGIQUES-2026-01/10-ACTIONS_CRITIQUES_AUDIT.md"
);

const source = fs.readFileSync(sourcePath, "utf8");
const match = source.match(/const\s+CONFIRM_ACTIONS\s*=\s*(\{[\s\S]*?\n\});/);

if (!match) {
  throw new Error("Impossible de trouver CONFIRM_ACTIONS dans confirm-modal.js");
}

let actions;
try {
  // eslint-disable-next-line no-new-func
  actions = new Function(`return ${match[1]}`)();
} catch (error) {
  throw new Error(`Erreur de parsing CONFIRM_ACTIONS: ${error.message}`);
}

const rows = Object.entries(actions)
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([key, value]) => {
    const message = value.message || "";
    const variant = value.variant || "standard";
    return `| ${key} | ${message} | ${variant} |`;
  })
  .join("\n");

const content = `# Audit — Actions critiques & confirmations (Ciné Délices)

> Document **généré automatiquement**.  
> Source : \`app/public/js/confirm-modal.js\` (objet \`CINE_CONFIRM_ACTIONS\`).

## 📌 Liste centralisée

| Clé | Message | Variant |
| --- | --- | --- |
${rows}

## 🔎 Notes
- \`variant: danger\` → action irréversible (suppression/refus destructif).
- \`variant: warning\` → action sensible mais réversible.
- \`variant: standard\` → confirmation normale.
`;

fs.writeFileSync(outputPath, content, "utf8");
console.log(`✅ Audit généré : ${outputPath}`);
