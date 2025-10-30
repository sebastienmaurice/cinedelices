import 'dotenv/config';
import express from 'express';
import router from './app/route/index.route.js';


const app = express();

app.set('view engine', 'ejs');
app.set('views', './app/views');

const PORT = process.env.PORT || 3000;

// 🔹 Ajoute cette ligne pour servir CSS, JS, images...
app.use(express.static("./app/public"));


app.use(router);

app.listen(PORT, () => {
  console.log(`Le serveur est démarré sur http://localhost:${PORT}/home`);
  });