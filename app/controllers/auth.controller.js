import { Recipe, Movie, Notice, User } from "../models/index.model.js";
import jwt from "jsonwebtoken";
import * as argon2 from "argon2";
import { StatusCodes } from "http-status-codes";

const authController = {
  // pour se connecter
  async login(req, res) {
    const { pseudo, password } = req.body;

    try {
      const user = await User.findOne({ where: { pseudo: pseudo } });

      if (!user) {
        return res
          .status(StatusCodes.UNAUTHORIZED)
          .json({ error: "Pseudo ou mot de passe invalide" });
      }

      // on récupère le mot de passe de l'utilisateur pour le comparer avec celui fourni après qu'il ai été haché
      const hash = user.password;
      // comparaison du mot de passe donné avec celui enregistré
      const ok = await argon2.verify(hash, password);

      if (!ok) {
        return res
          .status(StatusCodes.UNAUTHORIZED)
          .json({ error: "Pseudo ou mot de passe invalide" });
      }

      // Création du token
      const token = jwt.sign(
        // le payload: ce sont les infos que contient le token
        { user_id: user.id, pseudo: user.pseudo, role: user.role },
        // JWT SECRET est la clé de chiffrement des données
        process.env.JWT_SECRET,
        // temps de validité du token avant expiration
        { expiresIn: "2h" }
      );

      // On stocke le token dans un cookie httpOnly
      res.cookie("token", token, {
        httpOnly: true, // Sécurise contre les attaques XSS
        secure: false, // Mettre true pour etre en HTTPS
        maxAge: 1000 * 60 * 60 * 2, // 1000 milliseconde = 1 seconde * 60 secondes = 1 minute * 60 minutes = 1 heure * 2 = 2 heures
      });

      res.status(StatusCodes.OK).redirect("/");
    } catch (error) {
      if (error.name === "SequelizeUniqueConstraintError") {
        return res
          .status(StatusCodes.CONFLICT)
          .json({ error: "le pseudo existe déjà" });
      }

      res
        .status(StatusCodes.INTERNAL_SERVER_ERROR)
        .json({ error: "Internal Server Error" });
    }
  },

  //pour s'inscrire
  async register(req, res) {
    // ! il faut sanitizer username
    const { first_name, last_name, pseudo, email, password, role } = req.body;

    try {
      const hash = await argon2.hash(password);

      const user = await User.create({
        first_name: first_name,
        last_name: last_name,
        pseudo: pseudo,
        email: email,
        password: hash,
        role: role,
      });
      // const user = await User.create({ toutes les données });

      res.status(StatusCodes.CREATED).redirect("/");
    } catch (error) {
      if (error.name === "SequelizeUniqueConstraintError") {
        return res
          .status(StatusCodes.CONFLICT)
          .json({ error: "Ce pseudo est déjà utilisé" });
      }

      res
        .status(StatusCodes.INTERNAL_SERVER_ERROR)
        .json({ error: "Internal Server Error" });
    }
  },

  //page profil
  async profil(req, res) {
    //recuperation info user
    if (!req.params.id) {
      return res.status(400).render("ID utilisateur manquant");
    }
    try {
      console.log(req.params.id);

      const user = await User.findByPk(req.params.id, {
        attributes: { exclude: ["password"] },
      });

      if (!user) {
        return res.status(404).send("Utilisateur non trouvé");
      }

      // Rendu de la vue avec les données utilisateur
      // ajout de la gestion de role
      res.render("user-profile", { user, role: req.userRole });
    } catch (error) {
      console.error(error);
      res.status(500).send("pages/error");
    }
  },

  //page avis
  quote(req, res) {
    res.send("donne note et avis");
    // ajout de la gestion de role
    //res.render("user-quote" ,{ role: req.userRole });
  },

  //deconnexion
  async logout(req, res) {
    res.clearCookie("token");
    res.redirect("/");
  },
};

export default authController;
