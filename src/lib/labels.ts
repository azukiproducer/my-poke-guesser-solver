import type { NumericField, NumericHint, SetField, SetHint } from './types';

export const numericFieldLabels: Record<NumericField, string> = {
  generation: '世代',
  baseStatTotal: '合計種族値',
  heightM: '高さ',
  weightKg: '重さ',
  genderRate: '性別比',
  evolutionCount: '進化数',
};

export const setFieldLabels: Record<SetField, string> = {
  types: 'タイプ',
  abilities: '特性',
  eggGroups: 'タマゴグループ',
};

export const numericHintLabels: Record<NumericHint, string> = {
  match: '一致',
  notMatch: '不一致',
  higher: '候補が上',
  lower: '候補が下',
  any: '未指定',
};

export const setHintLabels: Record<SetHint, string> = {
  exact: '完全一致',
  partial: '部分一致',
  none: '不一致',
  any: '未指定',
};

export const typeLabels: Record<string, string> = {
  normal: 'ノーマル',
  fire: 'ほのお',
  water: 'みず',
  electric: 'でんき',
  grass: 'くさ',
  ice: 'こおり',
  fighting: 'かくとう',
  poison: 'どく',
  ground: 'じめん',
  flying: 'ひこう',
  psychic: 'エスパー',
  bug: 'むし',
  rock: 'いわ',
  ghost: 'ゴースト',
  dragon: 'ドラゴン',
  dark: 'あく',
  steel: 'はがね',
  fairy: 'フェアリー',
};

export const eggGroupLabels: Record<string, string> = {
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

export function formatGenderRate(genderRate: number): string {
  if (genderRate === -1) return '不明';
  return `♀${(genderRate / 8) * 100}%`;
}

export function labelValues(values: readonly string[], labels: Record<string, string> = {}): string {
  return values.map((value) => labels[value] ?? value).join(' / ');
}
