/**
 * Cette classe est la classe mère de tous nos modèles.
 * Elle va servir à éviter la duplication de code dans les différents modèles, en gérant tout ce qui est commun à tous nos modèles (ou presque).
 * On ne fera jamais de "new" de cette classe, mais uniquement de ses enfants (c'est le cas de la plupart des classes mères).
 */
class BaseModel {
  #id; // Tous nos modèles ont un id (parceque toutes nos tables en DB ont un id)

  // Le constructeur de la classe mère

  constructor(id) {
    this.#id = id;
  }

  // Accesseurs et mutateurs communs à tous les modèles
  // (on pourrait aussi les faire dans les classes enfants, mais comme c'est commun à tous les modèles, on les fait ici)
  // Ils permettent d'accéder à l'id en dehors de la classe, et de le modifier si besoin
  
  // accesseur de l'id 
  //permet de récupérer la valeur d'une propiété privée

  get id() {
    return this.#id;
  }

  // mutateur de l'id
  //permet de modifier la valeur d'une propiété privée

  set id(id) {
    this.#id = id;
  }
}

export default BaseModel;
