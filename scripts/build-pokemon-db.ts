import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { PokemonDatabase, PokemonEntry } from '../src/lib/types';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const cacheDir = path.join(rootDir, '.cache', 'pokeapi');
const outputPath = path.join(rootDir, 'public', 'data', 'pokemon-db.json');
const apiBase = 'https://pokeapi.co/api/v2';
const configuredMaxDexNo = process.env.POKEMON_MAX_DEX_NO ? Number(process.env.POKEMON_MAX_DEX_NO) : null;
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

const includedFormNames = new Set([
  'rotom-heat',
  'rotom-wash',
  'rotom-frost',
  'rotom-fan',
  'rotom-mow',
  'castform-sunny',
  'castform-rainy',
  'castform-snowy',
  'deoxys-attack',
  'deoxys-defense',
  'deoxys-speed',
  'wormadam-sandy',
  'wormadam-trash',
  'giratina-origin',
  'dialga-origin',
  'palkia-origin',
  'shaymin-sky',
  'darmanitan-zen',
  'tornadus-therian',
  'thundurus-therian',
  'landorus-therian',
  'kyurem-black',
  'kyurem-white',
  'basculin-blue-striped',
  'basculin-white-striped',
  'meloetta-pirouette',
  'greninja-ash',
  'aegislash-blade',
  'zygarde-10',
  'zygarde-complete',
  'hoopa-unbound',
  'meowstic-female',
  'pumpkaboo-small',
  'pumpkaboo-large',
  'pumpkaboo-super',
  'gourgeist-small',
  'gourgeist-large',
  'gourgeist-super',
  'oricorio-pom-pom',
  'oricorio-pau',
  'oricorio-sensu',
  'wishiwashi-school',
  'lycanroc-midnight',
  'lycanroc-dusk',
  'minior-red',
  'necrozma-dusk',
  'necrozma-dawn',
  'necrozma-ultra',
  'magearna-original',
  'toxtricity-low-key',
  'eiscue-noice',
  'indeedee-female',
  'morpeko-hangry',
  'eternatus-eternamax',
  'zacian-crowned',
  'zamazenta-crowned',
  'ursaluna-bloodmoon',
  'enamorus-therian',
  'urshifu-rapid-strike',
  'calyrex-ice',
  'calyrex-shadow',
  'basculegion-female',
  'oinkologne-female',
  'palafin-hero',
  'dudunsparce-three-segment',
  'gimmighoul-roaming',
  'ogerpon-wellspring-mask',
  'ogerpon-hearthflame-mask',
  'ogerpon-cornerstone-mask',
  'terapagos-terastal',
  'terapagos-stellar',
]);

const formLabelsJa: Record<string, string> = {
  'rotom-heat': 'ヒートロトム',
  'rotom-wash': 'ウォッシュロトム',
  'rotom-frost': 'フロストロトム',
  'rotom-fan': 'スピンロトム',
  'rotom-mow': 'カットロトム',
  'castform-sunny': 'たいようのすがた',
  'castform-rainy': 'あまみずのすがた',
  'castform-snowy': 'ゆきぐものすがた',
  'deoxys-attack': 'アタックフォルム',
  'deoxys-defense': 'ディフェンスフォルム',
  'deoxys-speed': 'スピードフォルム',
  'wormadam-sandy': 'すなちのミノ',
  'wormadam-trash': 'ゴミのミノ',
  'giratina-origin': 'オリジンフォルム',
  'dialga-origin': 'オリジンフォルム',
  'palkia-origin': 'オリジンフォルム',
  'shaymin-sky': 'スカイフォルム',
  'darmanitan-zen': 'ダルマモード',
  'darmanitan-galar-standard': 'ガラルのすがた',
  'darmanitan-galar-zen': 'ガラルのすがた・ダルマモード',
  'tornadus-therian': 'れいじゅうフォルム',
  'thundurus-therian': 'れいじゅうフォルム',
  'landorus-therian': 'れいじゅうフォルム',
  'enamorus-therian': 'れいじゅうフォルム',
  'kyurem-black': 'ブラックキュレム',
  'kyurem-white': 'ホワイトキュレム',
  'basculin-red-striped': 'あかすじのすがた',
  'basculin-blue-striped': 'あおすじのすがた',
  'basculin-white-striped': 'しろすじのすがた',
  'meloetta-pirouette': 'ステップフォルム',
  'greninja-ash': 'サトシゲッコウガ',
  'aegislash-blade': 'ブレードフォルム',
  'zygarde-50': '50%フォルム',
  'zygarde-10': '10%フォルム',
  'zygarde-complete': 'パーフェクトフォルム',
  'hoopa-unbound': 'ときはなたれしすがた',
  'meowstic-male': 'オスのすがた',
  'meowstic-female': 'メスのすがた',
  'pumpkaboo-average': 'ふつうのサイズ',
  'pumpkaboo-small': 'ちいさいサイズ',
  'pumpkaboo-large': 'おおきいサイズ',
  'pumpkaboo-super': 'とくだいサイズ',
  'gourgeist-average': 'ふつうのサイズ',
  'gourgeist-small': 'ちいさいサイズ',
  'gourgeist-large': 'おおきいサイズ',
  'gourgeist-super': 'とくだいサイズ',
  'oricorio-pom-pom': 'ぱちぱちスタイル',
  'oricorio-pau': 'ふらふらスタイル',
  'oricorio-sensu': 'まいまいスタイル',
  'wishiwashi-school': 'むれたすがた',
  'lycanroc-midnight': 'まよなかのすがた',
  'lycanroc-dusk': 'たそがれのすがた',
  'minior-red-meteor': 'りゅうせいのすがた',
  'minior-red': 'コアのすがた',
  'necrozma-dusk': 'たそがれのたてがみ',
  'necrozma-dawn': 'あかつきのつばさ',
  'necrozma-ultra': 'ウルトラネクロズマ',
  'magearna-original': '500年前の色',
  'toxtricity-low-key': 'ローなすがた',
  'eiscue-noice': 'ナイスフェイス',
  'indeedee-male': 'オスのすがた',
  'indeedee-female': 'メスのすがた',
  'morpeko-hangry': 'はらぺこもよう',
  'eternatus-eternamax': 'ムゲンダイマックス',
  'zacian-crowned': 'けんのおう',
  'zamazenta-crowned': 'たてのおう',
  'ursaluna-bloodmoon': 'アカツキ',
  'urshifu-rapid-strike': 'れんげきのかた',
  'calyrex-ice': 'はくばじょうのすがた',
  'calyrex-shadow': 'こくばじょうのすがた',
  'basculegion-female': 'メスのすがた',
  'oinkologne-male': 'オスのすがた',
  'oinkologne-female': 'メスのすがた',
  'palafin-hero': 'マイティフォルム',
  'dudunsparce-three-segment': 'みつふしフォルム',
  gimmighoul: 'はこフォルム',
  'gimmighoul-roaming': 'とほフォルム',
  'ogerpon-wellspring-mask': 'いどのめん',
  'ogerpon-hearthflame-mask': 'かまどのめん',
  'ogerpon-cornerstone-mask': 'いしずえのめん',
  'terapagos-terastal': 'テラスタルフォルム',
  'terapagos-stellar': 'ステラフォルム',
};

const generationOverrides: Record<string, number> = {
  'dialga-origin': 8,
  'palkia-origin': 8,
  'basculin-white-striped': 8,
  'greninja-ash': 7,
  'zygarde-10': 7,
  'zygarde-complete': 7,
  'ursaluna-bloodmoon': 9,
};

const generationSixMegaForms = new Set([
  'venusaur-mega',
  'charizard-mega-x',
  'charizard-mega-y',
  'blastoise-mega',
  'beedrill-mega',
  'pidgeot-mega',
  'alakazam-mega',
  'slowbro-mega',
  'gengar-mega',
  'kangaskhan-mega',
  'pinsir-mega',
  'gyarados-mega',
  'aerodactyl-mega',
  'mewtwo-mega-x',
  'mewtwo-mega-y',
  'ampharos-mega',
  'steelix-mega',
  'scizor-mega',
  'heracross-mega',
  'houndoom-mega',
  'tyranitar-mega',
  'sceptile-mega',
  'blaziken-mega',
  'swampert-mega',
  'gardevoir-mega',
  'sableye-mega',
  'mawile-mega',
  'aggron-mega',
  'medicham-mega',
  'manectric-mega',
  'sharpedo-mega',
  'camerupt-mega',
  'altaria-mega',
  'banette-mega',
  'absol-mega',
  'glalie-mega',
  'salamence-mega',
  'metagross-mega',
  'latias-mega',
  'latios-mega',
  'rayquaza-mega',
  'lopunny-mega',
  'garchomp-mega',
  'lucario-mega',
  'abomasnow-mega',
  'gallade-mega',
  'audino-mega',
  'diancie-mega',
]);

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

interface ListApiResponse {
  count: number;
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

function formGeneration(species: SpeciesApiResponse, pokemonName: string): number {
  if (generationOverrides[pokemonName]) return generationOverrides[pokemonName];
  if (generationSixMegaForms.has(pokemonName) || pokemonName.endsWith('-primal')) return 6;
  if (pokemonName.includes('-mega')) return 9;
  if (pokemonName.includes('-alola')) return 7;
  if (pokemonName.includes('-galar') || pokemonName.includes('-hisui')) return 8;
  if (pokemonName.includes('-paldea')) return 9;
  return generationNumber(species.generation.name);
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

function isIncludedVariety(variety: SpeciesApiResponse['varieties'][number]): boolean {
  const name = variety.pokemon.name;
  if (variety.is_default) return true;
  if (name.includes('-gmax') || name.includes('-totem') || name.includes('-cap')) return false;
  if (
    name.startsWith('pikachu-') ||
    name === 'eevee-starter' ||
    name === 'zygarde-mega' ||
    name === 'zarude-dada' ||
    name.startsWith('koraidon-') ||
    name.startsWith('miraidon-')
  ) {
    return false;
  }

  return (
    name.includes('-mega') ||
    name.endsWith('-primal') ||
    includedFormNames.has(name) ||
    /-(alola|galar|hisui)(-|$)/.test(name) ||
    /-paldea(-|$)/.test(name)
  );
}

function formLabelJa(pokemonName: string): string {
  if (formLabelsJa[pokemonName]) return formLabelsJa[pokemonName];
  if (pokemonName.endsWith('-primal')) return 'ゲンシカイキ';
  if (pokemonName.endsWith('-mega-x')) return 'メガX';
  if (pokemonName.endsWith('-mega-y')) return 'メガY';
  if (pokemonName.endsWith('-mega-z')) return 'メガZ';
  if (pokemonName.includes('-mega')) return 'メガ';
  if (pokemonName.includes('-alola')) return 'アローラのすがた';
  if (pokemonName.includes('-galar')) return 'ガラルのすがた';
  if (pokemonName.includes('-hisui')) return 'ヒスイのすがた';
  if (pokemonName.includes('-paldea-combat-breed')) return 'パルデアのすがた・コンバット種';
  if (pokemonName.includes('-paldea-blaze-breed')) return 'パルデアのすがた・ブレイズ種';
  if (pokemonName.includes('-paldea-aqua-breed')) return 'パルデアのすがた・ウォーター種';
  if (pokemonName.includes('-paldea')) return 'パルデアのすがた';
  return '';
}

function displayJapaneseName(species: SpeciesApiResponse, pokemonName: string): string {
  const speciesName = pickJapaneseName(species, pokemonName);
  if (pokemonName.endsWith('-mega-x')) return `メガ${speciesName}X`;
  if (pokemonName.endsWith('-mega-y')) return `メガ${speciesName}Y`;
  if (pokemonName.endsWith('-mega-z')) return `メガ${speciesName}Z`;
  if (pokemonName.includes('-mega')) return `メガ${speciesName}`;

  const label = formLabelJa(pokemonName);
  return label ? `${speciesName}(${label})` : speciesName;
}

function evolutionDepth(node: EvolutionNode, speciesName: string, depth = 0): number | null {
  if (node.species.name === speciesName) return depth;

  for (const child of node.evolves_to) {
    const childDepth = evolutionDepth(child, speciesName, depth + 1);
    if (childDepth !== null) return childDepth;
  }

  return null;
}

async function resolveMaxDexNo(): Promise<number> {
  if (configuredMaxDexNo !== null) return configuredMaxDexNo;

  const data = await fetchJson<ListApiResponse>(`${apiBase}/pokemon-species?limit=1`);
  return data.count;
}

async function buildEntry(species: SpeciesApiResponse, pokemonResource: NamedResource, chain: EvolutionChainResponse): Promise<PokemonEntry> {
  const pokemon = await fetchJson<PokemonApiResponse>(pokemonResource.url);

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
    key: pokemon.name,
    dexNo: species.id,
    nameJa: displayJapaneseName(species, pokemon.name),
    nameEn: pokemon.name,
    generation: formGeneration(species, pokemon.name),
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
  const maxDexNo = await resolveMaxDexNo();

  for (let id = 1; id <= maxDexNo; id += 1) {
    try {
      const species = await fetchJson<SpeciesApiResponse>(`${apiBase}/pokemon-species/${id}`);
      const chain = await fetchJson<EvolutionChainResponse>(species.evolution_chain.url);
      const varieties = species.varieties.filter(isIncludedVariety);

      for (const variety of varieties) {
        const entry = await buildEntry(species, variety.pokemon, chain);
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
    pokemon: entries.sort((a, b) => a.dexNo - b.dexNo || a.nameJa.localeCompare(b.nameJa, 'ja')),
  };

  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(database, null, 2)}\n`);
  console.log(`Wrote ${entries.length} entries to ${outputPath}`);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
