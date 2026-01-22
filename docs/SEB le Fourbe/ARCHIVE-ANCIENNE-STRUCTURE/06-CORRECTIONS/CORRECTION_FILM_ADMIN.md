# Correction : Film ne s'affiche pas dans la liste de validation admin

## Problème Identifié

L'autocomplétion ne propose **que les films validés** (`status: true`). Donc :

- Si l'utilisateur **sélectionne** un film via l'autocomplétion → film déjà validé, réutilisé, n'apparaît pas dans la validation
- Si l'utilisateur **tape manuellement** un nouveau film → devrait créer un nouveau film avec `status: false`

## Solutions Possibles

### Solution 1 : Forcer création nouvelle pour films manuels (Recommandée)

Quand un film est créé manuellement (pas via autocomplétion), créer **toujours** un nouveau film avec `status: false`, même si un doublon existe déjà.

**Avantages :**

- Garantit que chaque nouveau film saisi apparaît dans la validation
- Permet à l'admin de choisir si c'est un doublon ou non

**Inconvénients :**

- Peut créer des doublons si l'admin ne vérifie pas

### Solution 2 : Afficher les films non validés dans l'autocomplétion

Modifier l'autocomplétion pour proposer aussi les films non validés.

**Avantages :**

- Évite les doublons lors de la sélection

**Inconvénients :**

- Peut montrer des films en cours de validation (peut être confus)

### Solution 3 : Améliorer la détection de doublons

La logique actuelle devrait déjà fonctionner. Peut-être vérifier si le problème vient d'ailleurs.

## Modification Actuelle

La logique de détection de doublons a été améliorée pour :

1. Chercher d'abord les films non validés (`status: false`)
2. Si trouvé, réutiliser
3. Sinon, chercher les films validés (`status: true`)
4. Si trouvé, réutiliser (évite doublons)
5. Sinon, créer un nouveau film avec `status: false`

## Recommandation

**Pour le moment, la modification actuelle devrait fonctionner.** Si le problème persiste :

1. Vérifier si le film a été créé manuellement ou sélectionné via autocomplétion
2. Si sélectionné via autocomplétion → c'est normal qu'il n'apparaisse pas (film déjà validé)
3. Si créé manuellement → le film devrait apparaître dans la liste de validation

Si besoin, on peut implémenter la Solution 1 pour forcer la création d'un nouveau film lors de la saisie manuelle.
