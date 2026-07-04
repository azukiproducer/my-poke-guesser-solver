import type {
  GuessTrial,
  NumericField,
  NumericHint,
  PokemonEntry,
  SetField,
  SetHint,
  SortState,
} from './types';

export function normalizeSet(values: readonly string[]): string[] {
  return [...new Set(values.map((value) => value.trim().toLowerCase()).filter(Boolean))].sort();
}

export function isSameSet(a: readonly string[], b: readonly string[]): boolean {
  const normalizedA = normalizeSet(a);
  const normalizedB = normalizeSet(b);

  return normalizedA.length === normalizedB.length && normalizedA.every((value, index) => value === normalizedB[index]);
}

export function compareNumericHint(candidateValue: number, inputValue: number, hint: NumericHint): boolean {
  if (hint === 'any') return true;
  if (hint === 'match') return candidateValue === inputValue;
  if (hint === 'notMatch') return candidateValue !== inputValue;
  if (inputValue === -1 || candidateValue === -1) return false;
  if (hint === 'higher') return candidateValue > inputValue;
  if (hint === 'lower') return candidateValue < inputValue;
  return true;
}

export function compareSetHint(candidateValues: readonly string[], inputValues: readonly string[], hint: SetHint): boolean {
  if (hint === 'any') return true;

  const candidateSet = normalizeSet(candidateValues);
  const inputSet = normalizeSet(inputValues);
  const hasOverlap = candidateSet.some((value) => inputSet.includes(value));
  const same = isSameSet(candidateSet, inputSet);

  if (hint === 'exact') return same;
  if (hint === 'partial') return hasOverlap && !same;
  if (hint === 'none') return !hasOverlap;
  return true;
}

export function filterCandidates(pokemon: readonly PokemonEntry[], trials: readonly GuessTrial[]): PokemonEntry[] {
  const byKey = new Map(pokemon.map((entry) => [entry.key, entry]));

  return pokemon.filter((candidate) =>
    trials.every((trial) => {
      const guessed = byKey.get(trial.pokemonKey);
      if (!guessed) return true;

      const numericMatches = (Object.entries(trial.numericHints) as [NumericField, NumericHint][]).every(([field, hint]) =>
        compareNumericHint(candidate[field], guessed[field], hint),
      );

      const setMatches = (Object.entries(trial.setHints) as [SetField, SetHint][]).every(([field, hint]) =>
        compareSetHint(candidate[field], guessed[field], hint),
      );

      return numericMatches && setMatches;
    }),
  );
}

export function sortCandidates(candidates: readonly PokemonEntry[], sort: SortState): PokemonEntry[] {
  const direction = sort.direction === 'asc' ? 1 : -1;

  return [...candidates].sort((a, b) => {
    const valueA = a[sort.key];
    const valueB = b[sort.key];

    if (Array.isArray(valueA) && Array.isArray(valueB)) {
      return valueA.join(',').localeCompare(valueB.join(','), 'ja') * direction;
    }

    if (typeof valueA === 'string' && typeof valueB === 'string') {
      return valueA.localeCompare(valueB, 'ja') * direction;
    }

    const numericComparison = Number(valueA) - Number(valueB);
    if (numericComparison !== 0) return numericComparison * direction;

    return a.nameJa.localeCompare(b.nameJa, 'ja');
  });
}

export function recommendNextGuess(_candidates: readonly PokemonEntry[]): PokemonEntry | null {
  return null;
}
