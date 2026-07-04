import { describe, expect, it } from 'vitest';
import { compareNumericHint, compareSetHint, filterCandidates, isSameSet } from '../lib/solver';
import type { GuessTrial, PokemonEntry } from '../lib/types';

const pokemon: PokemonEntry[] = [
  {
    dexNo: 1,
    nameJa: 'フシギダネ',
    nameEn: 'bulbasaur',
    generation: 1,
    types: ['grass', 'poison'],
    abilities: ['overgrow', 'chlorophyll'],
    baseStatTotal: 318,
    heightM: 0.7,
    weightKg: 6.9,
    genderRate: 1,
    evolutionCount: 2,
    eggGroups: ['monster', 'plant'],
    spriteUrl: '',
  },
  {
    dexNo: 4,
    nameJa: 'ヒトカゲ',
    nameEn: 'charmander',
    generation: 1,
    types: ['fire'],
    abilities: ['blaze', 'solar-power'],
    baseStatTotal: 309,
    heightM: 0.6,
    weightKg: 8.5,
    genderRate: 1,
    evolutionCount: 2,
    eggGroups: ['monster', 'dragon'],
    spriteUrl: '',
  },
  {
    dexNo: 25,
    nameJa: 'ピカチュウ',
    nameEn: 'pikachu',
    generation: 1,
    types: ['electric'],
    abilities: ['static', 'lightning-rod'],
    baseStatTotal: 320,
    heightM: 0.4,
    weightKg: 6,
    genderRate: 4,
    evolutionCount: 2,
    eggGroups: ['ground', 'fairy'],
    spriteUrl: '',
  },
];

function trial(overrides: Partial<GuessTrial>): GuessTrial {
  return {
    id: 'test',
    pokemonDexNo: 1,
    createdAt: '2026-07-04T00:00:00.000Z',
    numericHints: {
      generation: 'any',
      baseStatTotal: 'any',
      heightM: 'any',
      weightKg: 'any',
      genderRate: 'any',
      evolutionCount: 'any',
    },
    setHints: {
      types: 'any',
      abilities: 'any',
      eggGroups: 'any',
    },
    ...overrides,
  };
}

describe('set comparison', () => {
  it('matches exact sets independent of order', () => {
    expect(isSameSet(['poison', 'grass'], ['grass', 'poison'])).toBe(true);
    expect(compareSetHint(['poison', 'grass'], ['grass', 'poison'], 'exact')).toBe(true);
  });

  it('matches partial overlap', () => {
    expect(compareSetHint(['monster', 'dragon'], ['monster', 'plant'], 'partial')).toBe(true);
  });

  it('matches no overlap', () => {
    expect(compareSetHint(['electric'], ['grass', 'poison'], 'none')).toBe(true);
  });
});

describe('numeric comparison', () => {
  it('handles higher, lower, and match', () => {
    expect(compareNumericHint(320, 318, 'higher')).toBe(true);
    expect(compareNumericHint(309, 318, 'lower')).toBe(true);
    expect(compareNumericHint(318, 318, 'match')).toBe(true);
  });

  it('handles not match', () => {
    expect(compareNumericHint(4, 1, 'notMatch')).toBe(true);
    expect(compareNumericHint(1, 1, 'notMatch')).toBe(false);
  });
});

describe('candidate filtering', () => {
  it('applies multiple trials with AND semantics', () => {
    const result = filterCandidates(pokemon, [
      trial({
        pokemonDexNo: 1,
        numericHints: { ...trial({}).numericHints, baseStatTotal: 'higher' },
      }),
      trial({
        pokemonDexNo: 25,
        setHints: { ...trial({}).setHints, types: 'exact' },
      }),
    ]);

    expect(result.map((entry) => entry.nameEn)).toEqual(['pikachu']);
  });
});
