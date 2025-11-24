# calcul moyenne notes avis  

## ajout dans le CONTROLLER "recipes-movie.controllers.js  

à la ligne 135  

``` js
    let averageQuote = 0; // Valeur par défaut si pas d'avis
    if (plainNotices.length > 0) {
    const sum = plainNotices.reduce((acc, n) => acc + (n.quote || 0), 0); // Somme des notes
    averageQuote = Math.round(sum / plainNotices.length); // Moyenne arrondie a l'entier le plus proche
    }
    console.log("note generale:", averageQuote);

    res.render("recipe-detail", {
    role: req.userRole,
    recipe: plainRecipe,
    descriptionBlocks,
    ingredientsBlocks,
    preparationBlocks,
    averageQuote, // Note moyenne à passer à la vue
    notices: plainNotices,
    });
```  

>[!NOTE]  
> .reduce() permet de transformer un tableau en une seule valeur (la somme).  
> 'acc' (accumulateur) : la somme courante des notes.  
> 'n' (notice) : chaque objet avis dans le tableau.  
> 'n.quote' : la note de chaque avis.  
> acc + (n.quote || 0) : ajoute la note actuelle à l'accumulateur, en utilisant 0 si la note est absente.

---  

## ajout dans la VUE "recipe-detail.ejs"  

ajout `<%= averageQuote %>` sur la ligne 61 et 68.  
