# dwwm-cinedelices  

## Installation  

<details>  

<summary>installation environnement</summary>

- 1 initialise le projet  

`npm init -y`  

- 2 install express  

`npm i express`  

- 3 install variables d'environnement  

`npm i dotenv`  

- 4 install moteur de vues  

`npm i ejs`  

</details>  

<details>  

<summary>preparation structure</summary>

- créer un fichier `.env`  
  ==> *prendre exemple sur .env.example*

- `.gitignore`  
  
    - dossier "node.modules
    - fichier `.env`
    - `journal.md` perso

- `package.json`  
  
  ```json     ...
    "type":"module",
    ...
    "scripts": {
    "dev": "node --watch index.js"
    }
    ```  
</details>  

---  

## TODO LIST

### sprint1:  

- [ ] structure de base.  
<details>  

<summary>structure</summary>  

    ```structure
    
                             
    ├── app/                         # Code source 
    │    ├── controllers/            # dossier des controllers
    │    │ 
    │    ├── models/                 # dossier des models
    │    │ 
    │    ├── public/                 # dossier public declarer pour ejs
    │    │      └── css/  
    │    │      │   └── reset.css    # css de reset
    │    │                    
    │    │      └── images/          # css de reset
    │    │      │   └── logo-cine-delices.png    
    │    │                    
    │    │      └── js/              # css de reset
    │    │      │   └── header.js    
    │    │                    
    │    │ 
    │    ├── routes/                 # dossier des routes 
    │    │                
    │    ├── views/                  # dossier des vues
    │    │ 
    ├── node_modules                 # dossier de dependances
    ├── .env                         # Fichiers variables d'environnement
    ├── .env.example                 # Fichiers d'exemple du .env  
    ├── .gitignore                   # Fichiers à ignorer par Git
    ├── index.js                     # fichier de depart
    ├── journal.md                   # journal perso 
    ├── package-lock.json            
    ├── package.json                 
    ├── README.md                    # journal commun
    
    
    ```
</details>  

- [ ] routes basiques
- [ ] vues  
- [ ] bdd
- [ ] middleware authentification