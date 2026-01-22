import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { CONFIRM_ACTIONS } from "../app/public/js/confirm-actions.data.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const targetPath = path.resolve(
  __dirname,
  "../docs/SEB le Fourbe/09-DOCS-PEDAGOGIQUES-2026-01/10-ACTIONS_CRITIQUES_AUDIT.md"
);

const rows = Object.entries(CONFIRM_ACTIONS)
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([key, config]) => {
    const message = config.message || "";
    const variant = config.variant || "standard";
    const tag =
      variant === "danger"
        ? "⚠️ action irréversible"
        : variant === "warning"
          ? "⚠️ action sensible"
          : "";
    return `| ${key} | ${message} | ${variant} | ${tag} |`;
  });

const content = `# Audit — Actions critiques & confirmations (Ciné Délices)

> Document auto-généré. Ne pas éditer manuellement.
> Source : \`app/public/js/confirm-actions.data.js\`
> Dernière génération : ${new Date().toISOString()}

## 📌 Liste centralisée

| Clé | Message | Variant | Tag |
| --- | --- | --- | --- |
${rows.join("\n")}

## 🔎 Notes
- \`variant: danger\` → action irréversible (suppression/refus).
- \`variant: warning\` → action sensible mais non destructrice.
- \`Tag\` : indique le niveau de criticité UX.
- \`variant: standard\` → confirmation normale.

## ✅ Bonnes pratiques
- Toute action critique doit référencer une clé dans \`CINE_CONFIRM_ACTIONS\`.
- Les messages doivent rester courts, explicites et cohérents.
`;

await fs.writeFile(targetPath, content, "utf8");
console.log(`Audit généré : ${targetPath}`);
