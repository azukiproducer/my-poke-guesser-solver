import { useEffect, useMemo, useState } from 'react';
import {
  formatGenderRate,
  eggGroupLabels,
  labelValues,
  numericFieldLabels,
  numericHintLabels,
  setFieldLabels,
  setHintLabels,
  typeLabels,
} from './lib/labels';
import { filterCandidates, sortCandidates } from './lib/solver';
import {
  numericFields,
  setFields,
  type GuessTrial,
  type NumericHint,
  type NumericField,
  type PokemonDatabase,
  type PokemonEntry,
  type SetHint,
  type SortKey,
  type SortState,
} from './lib/types';

const defaultNumericHints = Object.fromEntries(numericFields.map((field) => [field, 'any'])) as GuessTrial['numericHints'];
const defaultSetHints = Object.fromEntries(setFields.map((field) => [field, 'any'])) as GuessTrial['setHints'];
const equalityOnlyNumericFields = new Set<NumericField>(['genderRate', 'evolutionCount']);
const numericHintOptions: NumericHint[] = ['any', 'match', 'higher', 'lower'];
const equalityNumericHintOptions: NumericHint[] = ['any', 'match', 'notMatch'];
const setHintOptions: SetHint[] = ['any', 'exact', 'partial', 'none'];
const hintRows: ({ kind: 'numeric'; field: NumericField } | { kind: 'set'; field: 'types' | 'abilities' | 'eggGroups' })[][] = [
  [
    { kind: 'numeric', field: 'generation' },
    { kind: 'numeric', field: 'baseStatTotal' },
  ],
  [{ kind: 'set', field: 'types' }],
  [{ kind: 'set', field: 'abilities' }],
  [
    { kind: 'numeric', field: 'heightM' },
    { kind: 'numeric', field: 'weightKg' },
  ],
  [
    { kind: 'numeric', field: 'genderRate' },
    { kind: 'numeric', field: 'evolutionCount' },
  ],
  [{ kind: 'set', field: 'eggGroups' }],
];

function pokemonOptionLabel(pokemon: PokemonEntry): string {
  return `${pokemon.dexNo}: ${pokemon.nameJa}`;
}

function findPokemonByQuery(query: string, pokemon: readonly PokemonEntry[]): PokemonEntry | undefined {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return undefined;

  const dexNo = Number(normalized.split(':')[0]);
  if (Number.isInteger(dexNo)) {
    const byDexNo = pokemon.find((entry) => entry.dexNo === dexNo);
    if (byDexNo) return byDexNo;
  }

  return pokemon.find((entry) => {
    const optionLabel = pokemonOptionLabel(entry).toLowerCase();
    return optionLabel === normalized || entry.nameJa === query.trim() || entry.nameEn.toLowerCase() === normalized;
  });
}

function emptyTrial(pokemonDexNo = 1): Omit<GuessTrial, 'id' | 'createdAt'> {
  return {
    pokemonDexNo,
    numericHints: { ...defaultNumericHints },
    setHints: { ...defaultSetHints },
  };
}

export default function App() {
  const [database, setDatabase] = useState<PokemonDatabase | null>(null);
  const [loadError, setLoadError] = useState('');
  const [draft, setDraft] = useState<Omit<GuessTrial, 'id' | 'createdAt'>>(emptyTrial());
  const [pokemonQuery, setPokemonQuery] = useState('');
  const [trials, setTrials] = useState<GuessTrial[]>([]);
  const [sort, setSort] = useState<SortState>({ key: 'dexNo', direction: 'asc' });

  useEffect(() => {
    const dataVersion = import.meta.env.VITE_DATA_VERSION ?? 'local';

    fetch(`${import.meta.env.BASE_URL}data/pokemon-db.json?v=${dataVersion}`, { cache: 'no-store' })
      .then((response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json() as Promise<PokemonDatabase>;
      })
      .then((data) => {
        setDatabase(data);
        const firstPokemon = data.pokemon[0];
        setDraft(emptyTrial(firstPokemon?.dexNo ?? 1));
        setPokemonQuery(firstPokemon ? pokemonOptionLabel(firstPokemon) : '');
      })
      .catch((error: unknown) => {
        setLoadError(error instanceof Error ? error.message : 'データの読み込みに失敗しました');
      });
  }, []);

  const pokemon = database?.pokemon ?? [];
  const inputPokemon = findPokemonByQuery(pokemonQuery, pokemon);
  const selectedPokemon = inputPokemon ?? pokemon.find((entry) => entry.dexNo === draft.pokemonDexNo);
  const filtered = useMemo(() => filterCandidates(pokemon, trials), [pokemon, trials]);
  const sortedCandidates = useMemo(() => sortCandidates(filtered, sort), [filtered, sort]);

  function addTrial() {
    if (!inputPokemon) return;
    setTrials((current) => [
      ...current,
      {
        ...draft,
        pokemonDexNo: inputPokemon.dexNo,
        numericHints: { ...draft.numericHints },
        setHints: { ...draft.setHints },
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
      },
    ]);
  }

  function updateSort(key: SortKey) {
    setSort((current) => ({
      key,
      direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc',
    }));
  }

  function pickPokemon(entry: PokemonEntry) {
    setPokemonQuery(pokemonOptionLabel(entry));
    setDraft((current) => ({ ...current, pokemonDexNo: entry.dexNo }));
  }

  if (loadError) {
    return (
      <main className="page">
        <h1>Poke Guesser Solver</h1>
        <section className="card error">pokemon-db.json を読み込めませんでした: {loadError}</section>
      </main>
    );
  }

  return (
    <main className="page">
      <header className="appHeader">
        <div>
          <h1>Poke Guesser Solver</h1>
          <p>手入力した判定結果から候補を絞り込む静的ソルバー</p>
        </div>
        <div className="meta">
          <span>候補 {filtered.length} / {pokemon.length}</span>
          <span>DB {database?.generatedAt ? new Date(database.generatedAt).toLocaleDateString('ja-JP') : '読み込み中'}</span>
        </div>
      </header>

      <div className="layout">
        <aside className="side">
          <section className="card">
            <h2>試行追加フォーム</h2>
            <label className="field">
              <span>入力ポケモン</span>
              <input
                list="pokemon-options"
                value={pokemonQuery}
                onChange={(event) => {
                  const nextQuery = event.target.value;
                  const matchedPokemon = findPokemonByQuery(nextQuery, pokemon);
                  setPokemonQuery(nextQuery);

                  if (matchedPokemon) {
                    setDraft((current) => ({ ...current, pokemonDexNo: matchedPokemon.dexNo }));
                  }
                }}
                placeholder="名前または図鑑番号で検索"
              />
              <datalist id="pokemon-options">
                {pokemon.map((entry) => (
                  <option key={entry.dexNo} value={pokemonOptionLabel(entry)}>
                    {entry.nameEn}
                  </option>
                ))}
              </datalist>
            </label>

            <div className="hintGrid">
              {hintRows.map((row, index) => (
                <div className={row.length === 1 ? 'hintRow single' : 'hintRow'} key={index}>
                  {row.map((item) =>
                    item.kind === 'numeric' ? (
                      <HintButtonGroup
                        key={item.field}
                        label={numericFieldLabels[item.field]}
                        value={draft.numericHints[item.field]}
                        options={equalityOnlyNumericFields.has(item.field) ? equalityNumericHintOptions : numericHintOptions}
                        labels={numericHintLabels}
                        onChange={(value) =>
                          setDraft((current) => ({
                            ...current,
                            numericHints: { ...current.numericHints, [item.field]: value },
                          }))
                        }
                      />
                    ) : (
                      <HintButtonGroup
                        key={item.field}
                        label={setFieldLabels[item.field]}
                        value={draft.setHints[item.field]}
                        options={setHintOptions}
                        labels={setHintLabels}
                        onChange={(value) =>
                          setDraft((current) => ({
                            ...current,
                            setHints: { ...current.setHints, [item.field]: value },
                          }))
                        }
                      />
                    ),
                  )}
                </div>
              ))}
            </div>

            {selectedPokemon && (
              <div className="selected">
                <img src={selectedPokemon.spriteUrl} alt="" />
                <div>
                  <strong>{selectedPokemon.nameJa}</strong>
                  <span>No.{selectedPokemon.dexNo} / {labelValues(selectedPokemon.types, typeLabels)}</span>
                </div>
              </div>
            )}

            <button className="primary" onClick={addTrial} disabled={!inputPokemon}>
              条件を追加
            </button>
          </section>

          <section className="card">
            <h2>試行履歴</h2>
            {trials.length === 0 ? (
              <p className="muted">まだ条件はありません。</p>
            ) : (
              <div className="trialList">
                {trials.map((trial) => {
                  const guessed = pokemon.find((entry) => entry.dexNo === trial.pokemonDexNo);
                  return (
                    <article className="trial" key={trial.id}>
                      <div className="trialTitle">
                        <strong>{guessed?.nameJa ?? `No.${trial.pokemonDexNo}`}</strong>
                        <button onClick={() => setTrials((current) => current.filter((item) => item.id !== trial.id))}>削除</button>
                      </div>
                      <div className="chips">
                        {numericFields
                          .filter((field) => trial.numericHints[field] !== 'any')
                          .map((field) => (
                            <span key={field}>{numericFieldLabels[field]}: {numericHintLabels[trial.numericHints[field]]}</span>
                          ))}
                        {setFields
                          .filter((field) => trial.setHints[field] !== 'any')
                          .map((field) => (
                            <span key={field}>{setFieldLabels[field]}: {setHintLabels[trial.setHints[field]]}</span>
                          ))}
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        </aside>

        <section className="card candidates">
          <div className="sectionHeader">
            <h2>候補一覧</h2>
            <span>{filtered.length}件</span>
          </div>
          <PokemonTable candidates={sortedCandidates} sort={sort} onPickPokemon={pickPokemon} onSort={updateSort} />
        </section>
      </div>
    </main>
  );
}

interface HintButtonGroupProps<T extends NumericHint | SetHint> {
  label: string;
  value: T;
  options: readonly T[];
  labels: Record<T, string>;
  onChange: (value: T) => void;
}

function HintButtonGroup<T extends NumericHint | SetHint>({ label, value, options, labels, onChange }: HintButtonGroupProps<T>) {
  return (
    <fieldset className="field hintGroup">
      <legend>{label}</legend>
      <div className="segmented">
        {options.map((option) => (
          <button
            aria-pressed={option === value}
            className={option === value ? 'active' : ''}
            data-hint={option}
            key={option}
            onClick={() => onChange(option)}
            type="button"
          >
            <HintButtonContent hint={option} label={labels[option]} />
          </button>
        ))}
      </div>
    </fieldset>
  );
}

function HintButtonContent({ hint, label }: { hint: NumericHint | SetHint; label: string }) {
  if (hint === 'higher') {
    return (
      <>
        <span className="hintIcon up">▲</span>
        <span>{label}</span>
      </>
    );
  }

  if (hint === 'lower') {
    return (
      <>
        <span className="hintIcon down">▼</span>
        <span>{label}</span>
      </>
    );
  }

  return <span>{label}</span>;
}

interface PokemonTableProps {
  candidates: PokemonEntry[];
  sort: SortState;
  onPickPokemon: (pokemon: PokemonEntry) => void;
  onSort: (key: SortKey) => void;
}

function PokemonTable({ candidates, sort, onPickPokemon, onSort }: PokemonTableProps) {
  const headers: { key: SortKey; label: string }[] = [
    { key: 'dexNo', label: '図鑑番号' },
    { key: 'nameJa', label: '名前' },
    { key: 'generation', label: '世代' },
    { key: 'baseStatTotal', label: '合計種族値' },
    { key: 'types', label: 'タイプ' },
    { key: 'abilities', label: '特性' },
    { key: 'heightM', label: '高さ' },
    { key: 'weightKg', label: '重さ' },
    { key: 'genderRate', label: '性別比' },
    { key: 'evolutionCount', label: '進化数' },
    { key: 'eggGroups', label: 'タマゴグループ' },
  ];

  return (
    <div className="tableWrap">
      <table>
        <thead>
          <tr>
            <th>画像</th>
            {headers.map((header) => (
              <th key={header.key}>
                <button className="sortButton" onClick={() => onSort(header.key)}>
                  {header.label}
                  {sort.key === header.key ? (sort.direction === 'asc' ? ' ▲' : ' ▼') : ''}
                </button>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {candidates.map((entry) => (
            <tr key={entry.dexNo} onDoubleClick={() => onPickPokemon(entry)} title="ダブルクリックで入力ポケモンに設定">
              <td><img className="sprite" src={entry.spriteUrl} alt="" loading="lazy" /></td>
              <td>No.{entry.dexNo}</td>
              <td><strong>{entry.nameJa}</strong><br /><span className="muted">{entry.nameEn}</span></td>
              <td>{entry.generation}</td>
              <td>{entry.baseStatTotal}</td>
              <td>{labelValues(entry.types, typeLabels)}</td>
              <td>{labelValues(entry.abilities)}</td>
              <td>{entry.heightM}m</td>
              <td>{entry.weightKg}kg</td>
              <td>{formatGenderRate(entry.genderRate)}</td>
              <td>{entry.evolutionCount}</td>
              <td>{labelValues(entry.eggGroups, eggGroupLabels)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
