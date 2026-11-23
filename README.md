# Ma liste de Noël

Petit site statique (HTML/CSS/JS, sans build) qui présente ma liste de Noël.

## Fichiers

| Fichier | Rôle |
|---|---|
| `index.html` | La page |
| `style.css` | Le style et les animations |
| `app.js` | Affiche les cadeaux depuis `gifts.json`, filtre par budget, neige et guirlande |
| `gifts.json` | **La liste des cadeaux** : c'est le seul fichier à modifier pour ajouter/retirer un cadeau |
| `images/` | Photos des produits |
| `liste-de-noel.pdf` | Version PDF, téléchargeable depuis la page |

## Liste de Sarah

Le dossier `sarah/` est une seconde liste, indépendante, avec son propre thème (bordeaux et or).
Même principe : on modifie `sarah/gifts.json`. Champs en plus : `shop` (nom de la boutique),
`note` (petite précision facultative), et `price` peut valoir `null` si le prix est inconnu.
En ligne : `https://<utilisateur>.github.io/liste-de-kdo/sarah/`.

Les captures d'écran d'origine (`cadeaux sarah/`) sont ignorées par git et ne sont pas publiées.

## Modifier la liste

Ajouter un objet dans `gifts.json` :

```json
{
  "name": "Nom du produit",
  "price": 42.50,
  "image": "images/nom-du-produit.jpeg",
  "url": "https://..."
}
```

La fourchette de prix dans l'en-tête se met à jour toute seule.

## Voir le site en local

`gifts.json` est chargé avec `fetch`, donc il faut un petit serveur (ouvrir `index.html` en double-cliquant ne marche pas) :

```bash
python -m http.server 8765
```

Puis ouvrir <http://localhost:8765>.

## Mettre en ligne avec GitHub Pages

1. Créer un dépôt **public** sur GitHub (par ex. `liste-de-noel`).
2. Dans ce dossier :
   ```bash
   git init -b main
   git add .
   git commit -m "Ma liste de Noël"
   git remote add origin https://github.com/<utilisateur>/liste-de-noel.git
   git push -u origin main
   ```
3. Sur GitHub : **Settings → Pages → Source : Deploy from a branch → `main` / `(root)`** → Save.
4. Après une minute, le site est sur `https://<utilisateur>.github.io/liste-de-noel/`.
