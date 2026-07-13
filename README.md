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
  publie comme asset de la release `data-latest`.

## Asset publié

`https://github.com/Medialoco/accessibility-map-data/releases/download/data-latest/acceslibre.pmtiles`

Les points sont agrégés en grappes aux zooms bas (tippecanoe `--cluster-distance`,
attribut `point_count` accumulé).
