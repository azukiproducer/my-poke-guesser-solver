import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { PokemonDatabase, PokemonEntry } from '../src/lib/types';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const cacheDir = path.join(rootDir, '.cache', 'pokeapi');
const outputPath = path.join(rootDir, 'public', 'data', 'pokemon-db.json');
const apiBase = 'https://pokeapi.co/api/v2';
const maxDexNo = Number(process.env.POKEMON_MAX_DEX_NO ?? 1025);
const sleepMs = Number(process.env.POKEAPI_SLEEP_MS ?? 120);
const eggGroupNamesJa: Record<string, string> = {
  monster: '怪獣',
  water1: '水中1',
  bug: '虫',
  flying: '飛行',
  ground: '陸上',
  fairy: '妖精',
  plant: '植物',
  humanshape: '人型',
  water3: '水中3',
  mineral: '鉱物',
  amorphous: '不定形',
  water2: '水中2',
  ditto: 'メタモン',
  dragon: 'ドラゴン',
  'no-eggs': 'タマゴ未発見',
};

interface NamedResource {
  name: string;
  url: string;
}

interface LocalizedName {
  name: string;
  language: NamedResource;
}

interface LocalizedResourceResponse {
  names: LocalizedName[];
}

interface PokemonApiResponse {
  id: number;
  name: string;
  height: number;
  weight: number;
  types: { slot: number; type: NamedResource }[];
  abilities: { slot: number; is_hidden: boolean; ability: NamedResource }[];
  stats: { base_stat: number; stat: NamedResource }[];
  sprites: { front_default: string | null; other?: { 'official-artwork'?: { front_default: string | null } } };
}

interface SpeciesApiResponse {
  id: number;
  name: string;
  generation: NamedResource;
  names: LocalizedName[];
  gender_rate: number;
  egg_groups: NamedResource[];
  evolution_chain: { url: string };
  varieties: { is_default: boolean; pokemon: NamedResource }[];
}

interface EvolutionChainResponse {
  chain: EvolutionNode;
}

interface EvolutionNode {
  species: NamedResource;
  evolves_to: EvolutionNode[];
}

async function sleep(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

function cachePath(url: string): string {
  const urlPath = new URL(url).pathname.replace(/^\/+|\/+$/g, '').replace(/\//g, '__');
  return path.join(cacheDir, `${urlPath}.json`);
}

async function fetchJson<T>(url: string): Promise<T> {
  await mkdir(cacheDir, { recursive: true });
  const filePath = cachePath(url);

  try {
    return JSON.parse(await readFile(filePath, 'utf8')) as T;
  } catch {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`${url} failed: HTTP ${response.status}`);
    const json = (await response.json()) as T;
    await writeFile(filePath, `${JSON.stringify(json, null, 2)}\n`);
    await sleep(sleepMs);
    return json;
  }
}

function generationNumber(resourceName: string): number {
  const roman = resourceName.replace('generation-', '');
  const map: Record<string, number> = {
    i: 1,
    ii: 2,
    iii: 3,
    iv: 4,
    v: 5,
    vi: 6,
    vii: 7,
    viii: 8,
    ix: 9,
  };
  return map[roman] ?? 0;
}

function pickJapaneseName(species: SpeciesApiResponse, fallback: string): string {
  return pickLocalizedName(species.names, fallback);
}

function pickLocalizedName(names: LocalizedName[], fallback: string): string {
  return (
    names.find((item) => item.language.name === 'ja-Hrkt')?.name ??
    names.find((item) => item.language.name === 'ja')?.name ??
    fallback
  );
}

async function localizedResourceName(resource: NamedResource): Promise<string> {
  const data = await fetchJson<LocalizedResourceResponse>(resource.url);
  return pickLocalizedName(data.names, resource.name);
}

function evolutionDepth(node: EvolutionNode, speciesName: string, depth = 0): number | null {
  if (node.species.name === speciesName) return depth;

  for (const child of node.evolves_to) {
    const childDepth = evolutionDepth(child, speciesName, depth + 1);
    if (childDepth !== null) return childDepth;
  }

  return null;
}

async function buildEntry(id: number): Promise<PokemonEntry | null> {
  const species = await fetchJson<SpeciesApiResponse>(`${apiBase}/pokemon-species/${id}`);
  const defaultVariety = species.varieties.find((variety) => variety.is_default);
  const pokemonUrl = defaultVariety?.pokemon.url ?? `${apiBase}/pokemon/${id}`;
  const pokemon = await fetchJson<PokemonApiResponse>(pokemonUrl);
  const chain = await fetchJson<EvolutionChainResponse>(species.evolution_chain.url);

  if (pokemon.id > maxDexNo) return null;

  const types = await Promise.all(
    pokemon.types
      .sort((a, b) => a.slot - b.slot)
      .map((item) => localizedResourceName(item.type)),
  );
  const abilities = await Promise.all(
    pokemon.abilities
      .sort((a, b) => a.slot - b.slot)
      .map((item) => localizedResourceName(item.ability)),
  );
  const eggGroups = species.egg_groups.map((item) => eggGroupNamesJa[item.name] ?? item.name);

  return {
    dexNo: species.id,
    nameJa: pickJapaneseName(species, pokemon.name),
    nameEn: pokemon.name,
    generation: generationNumber(species.generation.name),
    types: types.slice(0, 2),
    abilities: abilities.slice(0, 3),
    baseStatTotal: pokemon.stats.reduce((sum, item) => sum + item.base_stat, 0),
    heightM: pokemon.height / 10,
    weightKg: pokemon.weight / 10,
    genderRate: species.gender_rate,
    evolutionCount: evolutionDepth(chain.chain, species.name) ?? 0,
    eggGroups: eggGroups.slice(0, 2),
    spriteUrl: pokemon.sprites.other?.['official-artwork']?.front_default ?? pokemon.sprites.front_default ?? '',
  };
}

async function main(): Promise<void> {
  const entries: PokemonEntry[] = [];

  for (let id = 1; id <= maxDexNo; id += 1) {
    try {
      const entry = await buildEntry(id);
      if (entry) {
        entries.push(entry);
        console.log(`(${id}/${maxDexNo}) ${entry.nameEn}`);
      }
    } catch (error) {
      console.warn(`Skip ${id}:`, error instanceof Error ? error.message : error);
    }
  }

  const database: PokemonDatabase = {
    generatedAt: new Date().toISOString(),
    source: 'PokeAPI',
    pokemon: entries.sort((a, b) => a.dexNo - b.dexNo),
  };

  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(database, null, 2)}\n`);
  console.log(`Wrote ${entries.length} entries to ${outputPath}`);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
