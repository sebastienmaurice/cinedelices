import User from "../models/user.js";
import jwt from 'jsonwebtoken';
import * as argon2 from 'argon2';
import { StatusCodes } from 'http-status-codes';

const authController = {



  //page d'inscription
  async register(req, res) {
    // ! il faut sanitizer username
    const { pseudo, email, password } = req.body;

    try {
        const hash = await argon2.hash(password);
        
        const user = await User.create({ pseudo: pseudo,email: email, password: hash });
        // const user = await User.create({ username, password: hash });

        res.status(StatusCodes.CREATED).json({ id: user.id, pseudo: user.pseudo, email: user.email });
    } catch (error) {
        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(StatusCodes.CONFLICT).json({ error: 'Ce pseudo est déjà utilisé' });
        }

        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: 'Internal Server Error' });
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
    console.log(user);
    res.render("user-profile", { user });
  } catch (error) {
    console.error(error);
    res.status(500).send("pages/error");
  }
},


  //page de connexion
  login(req, res) {
    res.send("page auth login");
  },

  //page avis
  quote(req, res) {
    res.send("donne note et avis");
  },

  //deconnexion
  logout(req, res) {
    res.send("deconnecté: redirect to home");
  },
};

export default authController;

