import { DataTypes, Model } from "sequelize";
import sequelize from "../database/sequelize-client.js";
import slugify from "slugify";

class Movie extends Model {}

Movie.init(
  {
    title: { type: DataTypes.TEXT, allowNull: false },
    slug: { type: DataTypes.STRING(255), allowNull: true, unique: true },
    year: { type: DataTypes.INTEGER, allowNull: false },
    genre: { type: DataTypes.STRING(100), allowNull: false },
    picture: { type: DataTypes.STRING(255) },
    synopsis: { type: DataTypes.TEXT, allowNull: true },
    // ENUM string : pending | approved | rejected (supérieur au BOOLEAN — cf. migration-status-enum.sql)
    status: { type: DataTypes.STRING(20), defaultValue: "pending" },
    validated_at: { type: DataTypes.DATE, allowNull: true },
    edit_status: { type: DataTypes.STRING(20), defaultValue: "none" },
    pending_title: { type: DataTypes.TEXT, allowNull: true },
    pending_year: { type: DataTypes.INTEGER, allowNull: true },
    pending_genre: { type: DataTypes.STRING(100), allowNull: true },
    edit_requested_at: { type: DataTypes.DATE, allowNull: true },
    delete_request_status: {
      type: DataTypes.STRING(20),
      defaultValue: "none",
    },
    delete_request_by: { type: DataTypes.INTEGER, allowNull: true },
    delete_request_at: { type: DataTypes.DATE, allowNull: true },
    tmdb_id: { type: DataTypes.INTEGER, allowNull: true, unique: true },
    // Données TMDB additionnelles (score, bande-annonce, équipe technique,
    // casting) — récupérées via l'API officielle à la création du film.
    // Conformité CGU TMDB : rafraîchies périodiquement (cf. tmdb_synced_at),
    // affichées avec l'attribution requise (voir partials/footer.ejs).
    tmdb_rating: { type: DataTypes.DECIMAL(3, 1), allowNull: true },
    trailer_key: { type: DataTypes.STRING(50), allowNull: true },
    director: { type: DataTypes.STRING(255), allowNull: true },
    composer: { type: DataTypes.STRING(255), allowNull: true },
    main_cast: { type: DataTypes.STRING(500), allowNull: true },
    tmdb_synced_at: { type: DataTypes.DATE, allowNull: true },
    runtime: { type: DataTypes.INTEGER, allowNull: true }, // durée en minutes
    id_user: { type: DataTypes.INTEGER, allowNull: true },
    type: {
      // <== Décommenté et activé
      type: DataTypes.STRING(10),
      defaultValue: "film",
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: "movies",
    hooks: {
      beforeCreate: (movie) => {
        if (!movie.slug && movie.title) {
          movie.slug = slugify(movie.title, { lower: true, strict: true });
        }
        if (movie.genre) movie.genre = movie.genre.toLowerCase();
      },
      beforeUpdate: (movie) => {
        if (movie.changed("title") && movie.title) {
          movie.slug = slugify(movie.title, { lower: true, strict: true });
        }
        if (movie.changed("genre") && movie.genre) {
          movie.genre = movie.genre.toLowerCase();
        }
      },
    },
  }
);

export default Movie;
