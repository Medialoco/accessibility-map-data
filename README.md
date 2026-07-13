# accessibility-map-data

Tuiles vectorielles **PMTiles** des établissements [Acceslibre](https://acceslibre.beta.gouv.fr/)
(données ouvertes, Licence Ouverte / Étalab 2.0), pour le site
[accessibility-map-fr](https://github.com/Medialoco/accessibility-map-fr).

Ce dépôt est **public** (les données sont ouvertes) alors que le dépôt applicatif
reste privé : cela permet au site GitHub Pages public de télécharger les tuiles
sans authentification.

## Contenu

- `src/fetch-csv.mjs` : télécharge l'export CSV France entière (data.gouv.fr) et
  produit un GeoJSON normalisé.
- `.github/workflows/data.yml` : reconstruit les tuiles chaque semaine et les
  publie sur **GitHub Pages de ce dépôt**.

## URL des tuiles

`https://medialoco.github.io/accessibility-map-data/acceslibre.pmtiles`

Servir depuis Pages (même origine `medialoco.github.io` que le site applicatif)
évite tout problème de CORS et supporte les requêtes HTTP Range nécessaires à
PMTiles. Les points sont agrégés en grappes aux zooms bas (tippecanoe
`--cluster-distance`, attribut `point_count` accumulé).
