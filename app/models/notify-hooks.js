/**
 * Notifications admin déclenchées par les modèles (hooks Sequelize).
 *
 * Un seul point d'accroche couvre toutes les voies (inscription classique, Google, contributions,
 * demandes de modification / suppression, photos, pseudo, bio, bannière), y compris les mises à jour
 * groupées `Model.update(values, { where })` qui ne déclenchent pas les hooks d'instance.
 *
 * Pour ne pas notifier (import, tests, création par l'admin) : `Model.create(values, { notifyAdmin: false })`.
 * Voir services/admin-notify.service.js pour le destinataire, l'activation et l'anti-spam.
 */
import { notifyAdmin, notificationsEnabled } from "../services/admin-notify.service.js";

const ADMIN_LINK = "/admin/";
const clip = (s, n = 160) => {
  const t = String(s ?? "").replace(/\s+/g, " ").trim();
  return t.length > n ? t.slice(0, n) + "…" : t;
};
const isTestEmail = (email) => /@example\.com$/i.test(String(email || ""));

/** Auteur (pseudo + email) d'un contenu, à partir de son id utilisateur. */
async function authorOf(User, id) {
  if (!id) return null;
  try {
    const u = await User.findByPk(id, { attributes: ["id", "pseudo", "email"] });
    return u ? `${u.pseudo} (${u.email})` : `utilisateur #${id}`;
  } catch {
    return `utilisateur #${id}`;
  }
}

export function registerNotifyHooks({ User, Recipe, Movie, Notice, RecipePicture }) {
  if (!notificationsEnabled()) {
    // Les hooks restent enregistrés (le coût est nul) : l'activation est évaluée à chaque événement.
  }

  /**
   * Règles : une transition vers "pending" sur `field` déclenche `describe`.
   * `onCreate: true` = vaut aussi à la création (statut initial "pending").
   */
  const RULES = [
    {
      model: Recipe, name: "Recette", field: "status", onCreate: true,
      describe: async (r) => ({
        title: "Nouvelle recette à valider",
        rows: [["Recette", r.name], ["Catégorie", r.category], ["Auteur", await authorOf(User, r.id_user)]],
      }),
    },
    {
      model: Recipe, name: "Recette", field: "edit_status",
      describe: async (r) => ({
        title: "Modification de recette à valider",
        rows: [["Recette", r.name], ["Nouveau titre", r.pending_name], ["Auteur", await authorOf(User, r.id_user)]],
      }),
    },
    {
      model: Recipe, name: "Recette", field: "delete_request_status",
      describe: async (r) => ({
        title: "Suppression de recette demandée",
        rows: [["Recette", r.name], ["Auteur", await authorOf(User, r.id_user)]],
      }),
    },
    {
      model: Movie, name: "Film", field: "status", onCreate: true,
      describe: async (m) => ({
        title: "Nouveau film à valider",
        rows: [["Film", `${m.title}${m.year ? " (" + m.year + ")" : ""}`], ["Genre", m.genre], ["Auteur", await authorOf(User, m.id_user)]],
      }),
    },
    {
      model: Movie, name: "Film", field: "edit_status",
      describe: async (m) => ({
        title: "Modification de film à valider",
        rows: [["Film", m.title], ["Nouveau titre", m.pending_title], ["Auteur", await authorOf(User, m.id_user)]],
      }),
    },
    {
      model: Movie, name: "Film", field: "delete_request_status",
      describe: async (m) => ({
        title: "Suppression de film demandée",
        rows: [["Film", m.title], ["Auteur", await authorOf(User, m.id_user)]],
      }),
    },
    {
      model: Notice, name: "Avis", field: "status", onCreate: true,
      describe: async (n) => ({
        title: n.parent_id ? "Nouvelle réponse à un avis à valider" : "Nouvel avis à valider",
        rows: [["Avis", clip(n.content)], ["Note", n.parent_id ? null : n.quote ? `${n.quote}/5` : null], ["Auteur", await authorOf(User, n.id_user)]],
      }),
    },
    {
      model: Notice, name: "Avis", field: "edit_status",
      describe: async (n) => ({
        title: "Modification d'avis à valider",
        rows: [["Nouveau texte", clip(n.pending_content)], ["Auteur", await authorOf(User, n.id_user)]],
      }),
    },
    {
      model: Notice, name: "Avis", field: "delete_request_status",
      describe: async (n) => ({
        title: "Suppression d'avis demandée",
        rows: [["Avis", clip(n.content)], ["Auteur", await authorOf(User, n.id_user)]],
      }),
    },
    {
      model: RecipePicture, name: "Photo", field: "status", onCreate: true,
      describe: async (p) => ({
        title: "Photo de recette à valider",
        rows: [["Recette n°", p.recipe_id], ["Photo", p.step_number ? `étape ${p.step_number}` : "galerie"]],
      }),
    },
    {
      model: User, name: "Profil", field: "pseudo_status",
      describe: async (u) => ({
        title: "Nouveau pseudo à valider",
        rows: [["Utilisateur", u.pseudo], ["Pseudo demandé", u.pending_pseudo], ["Email", u.email]],
      }),
    },
    {
      model: User, name: "Profil", field: "picture_status",
      describe: async (u) => ({
        title: "Nouvelle photo de profil à valider",
        rows: [["Utilisateur", u.pseudo], ["Email", u.email]],
      }),
    },
    {
      model: User, name: "Profil", field: "banner_status",
      describe: async (u) => ({
        title: "Nouvelle bannière de profil à valider",
        rows: [["Utilisateur", u.pseudo], ["Email", u.email]],
      }),
    },
    {
      model: User, name: "Profil", field: "bio_status",
      describe: async (u) => ({
        title: "Bio d'auteur à valider",
        rows: [["Utilisateur", u.pseudo], ["Bio", clip(u.pending_bio, 240)], ["Email", u.email]],
      }),
    },
  ];

  const send = async (rule, row) => {
    try {
      const { title, rows } = await rule.describe(row);
      notifyAdmin({ type: "moderation", title, rows, link: ADMIN_LINK });
    } catch (err) {
      console.error(`[notify] ${rule.name}/${rule.field} (ignoré) :`, err.message);
    }
  };

  for (const rule of RULES) {
    const { model, field } = rule;

    // Création directe en "pending"
    if (rule.onCreate) {
      model.addHook("afterCreate", `notify_create_${rule.name}_${field}`, async (inst, opts) => {
        if (opts?.notifyAdmin === false || !notificationsEnabled()) return;
        if (inst[field] === "pending") await send(rule, inst);
      });
    }

    // Mise à jour d'instance : passage à "pending"
    model.addHook("afterUpdate", `notify_update_${rule.name}_${field}`, async (inst, opts) => {
      if (opts?.notifyAdmin === false || !notificationsEnabled()) return;
      if (inst.changed(field) && inst[field] === "pending") await send(rule, inst);
    });

    // Mise à jour groupée Model.update({ ... }, { where }) : les hooks d'instance ne se déclenchent pas
    model.addHook("afterBulkUpdate", `notify_bulk_${rule.name}_${field}`, async (options) => {
      if (options?.notifyAdmin === false || !notificationsEnabled()) return;
      if (options?.attributes?.[field] !== "pending" || !options.where) return;
      try {
        const rows = await model.findAll({ where: options.where, limit: 10, transaction: options.transaction });
        for (const row of rows) await send(rule, row);
      } catch (err) {
        console.error(`[notify] bulk ${rule.name}/${field} (ignoré) :`, err.message);
      }
    });
  }

  // Nouvel utilisateur (inscription classique, Google, ou création manuelle)
  User.addHook("afterCreate", "notify_new_user", (user, opts) => {
    if (opts?.notifyAdmin === false || !notificationsEnabled()) return;
    if (isTestEmail(user.email)) return; // comptes de tests Playwright
    notifyAdmin({
      type: "user",
      title: `Nouvel utilisateur : ${user.pseudo}`,
      rows: [
        ["Pseudo", user.pseudo],
        ["Nom", `${user.first_name || ""} ${user.last_name || ""}`.trim()],
        ["Email", user.email],
        ["Inscription", user.google_id ? "Google" : "Formulaire"],
        ["Rôle", user.role],
      ],
      link: ADMIN_LINK,
    });
  });
}
