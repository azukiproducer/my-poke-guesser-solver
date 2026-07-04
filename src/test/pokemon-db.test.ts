import { describe, expect, it } from 'vitest';
import db from '../../public/data/pokemon-db.json';
import type { PokemonEntry } from '../lib/types';

const pokemon = db.pokemon as PokemonEntry[];

function byKey(key: string): PokemonEntry | undefined {
  return pokemon.find((entry) => entry.key === key);
}

function expectEntry(key: string): PokemonEntry {
  const entry = byKey(key);
  expect(entry, `${key} should exist`).toBeDefined();
  return entry as PokemonEntry;
}

function expectMissing(key: string): void {
  expect(byKey(key), `${key} should not exist`).toBeUndefined();
}

describe('pokemon database explicit form policy', () => {
  it('keeps explicitly requested form candidates', () => {
    const expectedNames: Record<string, string> = {
      'charizard-mega-x': 'メガリザードンX',
      'charizard-mega-y': 'メガリザードンY',
      'greninja-ash': 'ゲッコウガ(サトシゲッコウガ)',
      'wormadam-sandy': 'ミノマダム(すなちのミノ)',
      'wormadam-trash': 'ミノマダム(ゴミのミノ)',
      'oricorio-baile': 'オドリドリ',
      'oricorio-pom-pom': 'オドリドリ(ぱちぱちスタイル)',
      'oricorio-pau': 'オドリドリ(ふらふらスタイル)',
      'oricorio-sensu': 'オドリドリ(まいまいスタイル)',
      'minior-red-meteor': 'メテノ(りゅうせいのすがた)',
      'minior-red': 'メテノ(コアのすがた)',
      'darmanitan-zen': 'ヒヒダルマ(ダルマモード)',
      'gimmighoul': 'コレクレー(はこフォルム)',
      'gimmighoul-roaming': 'コレクレー(とほフォルム)',
      'eternatus-eternamax': 'ムゲンダイナ(ムゲンダイマックス)',
    };

    for (const [key, nameJa] of Object.entries(expectedNames)) {
      expect(expectEntry(key).nameJa).toBe(nameJa);
    }
  });

  it('keeps explicitly requested same-dex form groups', () => {
    expect(pokemon.filter((entry) => entry.dexNo === 550).map((entry) => entry.key).sort()).toEqual([
      'basculin-blue-striped',
      'basculin-red-striped',
      'basculin-white-striped',
    ]);

    expect(pokemon.filter((entry) => entry.dexNo === 678).map((entry) => entry.key).sort()).toEqual([
      'meowstic-female',
      'meowstic-male',
    ]);

    expect(pokemon.filter((entry) => entry.dexNo === 710).map((entry) => entry.key).sort()).toEqual([
      'pumpkaboo-average',
      'pumpkaboo-large',
      'pumpkaboo-small',
      'pumpkaboo-super',
    ]);

    expect(pokemon.filter((entry) => entry.dexNo === 711).map((entry) => entry.key).sort()).toEqual([
      'gourgeist-average',
      'gourgeist-large',
      'gourgeist-small',
      'gourgeist-super',
    ]);

    expect(pokemon.filter((entry) => entry.dexNo === 718).map((entry) => entry.key).sort()).toEqual([
      'zygarde-10',
      'zygarde-50',
      'zygarde-complete',
    ]);
  });

  it('excludes explicitly rejected split forms', () => {
    expectMissing('keldeo-resolute');
    expectMissing('maushold-family-of-three');
    expectMissing('tatsugiri-droopy');
    expectMissing('tatsugiri-stretchy');
    expectMissing('zygarde-10-power-construct');
    expectMissing('zygarde-50-power-construct');
    expectMissing('zygarde-mega');
  });

  it('uses first-appearance generation for forms', () => {
    const expectedGenerations: Record<string, number> = {
      'charizard-mega-x': 6,
      'charizard-mega-y': 6,
      'raichu-mega-x': 9,
      'dragonite-mega': 9,
      'rattata-alola': 7,
      'meowth-galar': 8,
      'growlithe-hisui': 8,
      'wooper-paldea': 9,
      'tauros-paldea-combat-breed': 9,
      'dialga-origin': 8,
      'palkia-origin': 8,
      'basculin-white-striped': 8,
      'greninja-ash': 7,
      'zygarde-10': 7,
      'zygarde-50': 6,
      'zygarde-complete': 7,
      'ursaluna-bloodmoon': 9,
    };

    for (const [key, generation] of Object.entries(expectedGenerations)) {
      expect(expectEntry(key).generation).toBe(generation);
    }
  });
});
