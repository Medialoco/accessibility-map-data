/**
 * Construit un jeu de points COMPACT (format colonnaire) pour le clustering
 * cote client dans accessibility-map-fr. Lit le NDJSON deja produit par
 * fetch-csv.mjs (out/acceslibre.geojson) et emet un JSON de colonnes paralleles :
 * beaucoup plus leger qu'un GeoJSON brut (pas de cles repetees), servable sous
 * la limite 100 Mo de GitHub Pages.
 *
 * Le clustering cote client permet aux filtres d'accessibilite de recomposer
 * les grappes instantanement (impossible avec des tuiles pre-agregees).
 *
 * Usage : node src/build-points.mjs [in.ndjson] [out.json]
 */
import { createReadStream, createWriteStream } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import { createInterface } from 'node:readline';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Ordre FIXE des criteres encodes dans les bitmasks k (connu) et v (vrai).
// DOIT rester synchronise avec POINTS_CRITERIA cote frontend.
const CRITERIA = [
  'wheelchairEntrance',
  'stepFreeEntrance',
  'accessibleParking',
  'adaptedToilets',
  'extStepFreePath',
  'audioBeacon',
  'guidePath',
  'hearingEquipment',
  'callDevice',
  'humanHelp',
  'publicTransport',
];

function round5(n) {
  return Math.round(n * 1e5) / 1e5;
}

/**
 * Identifiants Acceslibre : nombre d'etablissements par fichier.
 *
 * L'export CSV ouvert ne contient ni URL ni slug ; le seul moyen de renvoyer un
 * visiteur vers la fiche d'origine est le permalien
 * `acceslibre.beta.gouv.fr/uuid/<id>/`, qui redirige vers la page canonique.
 * Un UUID est aleatoire, donc incompressible : les 630 000 identifiants pesent
 * une dizaine de megaoctets, qu'on ne peut pas ajouter au fichier principal
 * sans retarder l'affichage de la carte. Ils sont donc ranges a part, par
 * tranches d'index : ouvrir une fiche ne telecharge que sa tranche (~160 Ko).
 */
const UUID_SHARD = 10000;

/** UUID textuel vers 16 octets ; renvoie des zeros si la forme est inattendue. */
function uuidBytes(s) {
  const hex = String(s || '').replace(/-/g, '');
  const out = new Uint8Array(16);
  if (hex.length !== 32 || /[^0-9a-fA-F]/.test(hex)) return out;
  for (let i = 0; i < 16; i += 1) out[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  return out;
}

async function main() {
  const args = process.argv.slice(2);
  const input = resolve(args[0] || resolve(__dirname, '../out/acceslibre.geojson'));
  const output = resolve(args[1] || resolve(__dirname, '../site/acceslibre-points.json'));
  await mkdir(dirname(output), { recursive: true });

  const lon = [];
  const lat = [];
  const k = []; // bitmask "critere renseigne"
  const v = []; // bitmask "critere vrai"
  const nom = [];
  const act = [];
  const com = [];
  const cp = [];
  const uuids = [];

  const rl = createInterface({ input: createReadStream(input, 'utf8'), crlfDelay: Infinity });
  let n = 0;
  for await (const line of rl) {
    if (!line) continue;
    let f;
    try {
      f = JSON.parse(line);
    } catch {
      continue;
    }
    const c = f.geometry?.coordinates;
    if (!c) continue;
    const p = f.properties || {};

    let kk = 0;
    let vv = 0;
    for (let i = 0; i < CRITERIA.length; i += 1) {
      const val = p[CRITERIA[i]];
      if (val === true || val === false) {
        kk |= 1 << i;
        if (val === true) vv |= 1 << i;
      }
    }

    lon.push(round5(c[0]));
    lat.push(round5(c[1]));
    k.push(kk);
    v.push(vv);
    nom.push(p.nom || '');
    act.push(p.activite || '');
    com.push(p.commune || '');
    cp.push(p.code_postal || '');
    uuids.push(uuidBytes(p.uuid));
    n += 1;
  }

  const payload = { n, criteria: CRITERIA, lon, lat, k, v, nom, act, com, cp, uuidShard: UUID_SHARD };
  const sink = createWriteStream(output, { encoding: 'utf8' });
  await new Promise((res, rej) => {
    sink.on('error', rej);
    sink.write(JSON.stringify(payload), (err) => (err ? rej(err) : res()));
  });
  await new Promise((r) => sink.end(r));
  process.stderr.write(`Ecrit ${n} points compacts -> ${output}\n`);

  // Tranches d'identifiants, indexees sur la meme position que les colonnes
  // ci-dessus : la tranche `i / UUID_SHARD` contient l'UUID du point `i`.
  const shardDir = resolve(dirname(output), 'acceslibre-uuids');
  await mkdir(shardDir, { recursive: true });
  const shards = Math.ceil(n / UUID_SHARD);
  for (let s = 0; s < shards; s += 1) {
    const from = s * UUID_SHARD;
    const count = Math.min(UUID_SHARD, n - from);
    const buf = Buffer.allocUnsafe(count * 16);
    for (let j = 0; j < count; j += 1) buf.set(uuids[from + j], j * 16);
    await writeFile(resolve(shardDir, `${String(s).padStart(4, '0')}.bin`), buf);
  }
  process.stderr.write(`Ecrit ${shards} tranches d'identifiants -> ${shardDir}\n`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
