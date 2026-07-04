export type NumericHint = 'match' | 'notMatch' | 'higher' | 'lower' | 'any';
export type SetHint = 'exact' | 'partial' | 'none' | 'any';
export type HintResult = NumericHint | SetHint;

export interface PokemonEntry {
  key: string;
  dexNo: number;
  nameJa: string;
  nameEn: string;
  generation: number;
  types: string[];
  abilities: string[];
  baseStatTotal: number;
  heightM: number;
  weightKg: number;
  genderRate: number;
  evolutionCount: number;
  eggGroups: string[];
  spriteUrl: string;
}

export interface PokemonDatabase {
  generatedAt: string;
  source: string;
  pokemon: PokemonEntry[];
}

export type NumericField =
  | 'generation'
  | 'baseStatTotal'
  | 'heightM'
  | 'weightKg'
  | 'genderRate'
  | 'evolutionCount';

export type SetField = 'types' | 'abilities' | 'eggGroups';

export interface GuessTrial {
  id: string;
  pokemonKey: string;
  numericHints: Record<NumericField, NumericHint>;
  setHints: Record<SetField, SetHint>;
  createdAt: string;
}

export type SortDirection = 'asc' | 'desc';

export type SortKey =
  | 'dexNo'
  | 'nameJa'
  | 'generation'
  | 'baseStatTotal'
  | 'heightM'
  | 'weightKg'
  | 'genderRate'
  | 'evolutionCount'
  | 'types'
  | 'abilities'
  | 'eggGroups';

export interface SortState {
  key: SortKey;
  direction: SortDirection;
}

export const numericFields: NumericField[] = [
  'generation',
  'baseStatTotal',
  'heightM',
  'weightKg',
  'genderRate',
  'evolutionCount',
];

export const setFields: SetField[] = ['types', 'abilities', 'eggGroups'];
