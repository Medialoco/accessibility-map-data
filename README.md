# accessibility-map-data

Données [Acceslibre](https://acceslibre.beta.gouv.fr/) pré-traitées et publiées
sur **GitHub Pages**, qui alimentent le site
[accessibility-map-fr](https://github.com/thepriben/accessibility-map-fr)
(carte collaborative de l'accessibilité des lieux publics en France).

Séparer les données du code applicatif permet de les régénérer et de les servir
indépendamment, sur la même origine que le site (`thepriben.github.io`) : pas de
problème de CORS et prise en charge des requêtes HTTP par plage.

## Ce que publie ce dépôt

Le workflow reconstruit deux artefacts depuis l'export CSV ouvert d'Acceslibre
(data.gouv.fr, **sans clé d'API**) et les déploie sur GitHub Pages :

- **`acceslibre-points.json`** — jeu de points compact (format colonnaire).
  C'est la source utilisée par le site : elle est chargée une seule fois dans un
  *Web Worker* qui indexe les points (Supercluster) et répond au regroupement, à
  la recherche et aux filtres côté client.
  → `https://thepriben.github.io/accessibility-map-data/acceslibre-points.json`
- **`acceslibre.pmtiles`** — les mêmes établissements en tuiles vectorielles
  PMTiles (pré-agrégées en grappes par `tippecanoe`), conservées comme
  alternative de rendu.
  → `https://thepriben.github.io/accessibility-map-data/acceslibre.pmtiles`

## Pipeline

- `src/fetch-csv.mjs` — télécharge l'export CSV France entière et produit un
  GeoJSON normalisé. Les coordonnées sont validées (détection des latitude /
  longitude inversées, points hors zone écartés).
- `src/build-points.mjs` — condense le GeoJSON en JSON colonnaire compact
  (bitmasks pour les critères d'accessibilité) destiné au clustering côté client.
- `.github/workflows/data.yml` — enchaîne fetch → PMTiles (`tippecanoe`) →
  points compacts, puis publie le tout sur le GitHub Pages de ce dépôt.

## Mise à jour

Reconstruction **automatique chaque jour** (~03:00 heure de Paris, via `cron`) et manuelle
(*workflow_dispatch*). Le site lisant ces URL à l'exécution, un rafraîchissement
des données est pris en compte **sans redéploiement** du site.

## Licence

Données : Acceslibre — Licence Ouverte / Étalab 2.0.
