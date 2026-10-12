export type Confidence = 'verified' | 'reported' | 'unconfirmed';

export type Category =
  | 'template'
  | 'linkage'
  | 'registration'
  | 'diagnosis'
  | 'design';

export interface Entry {
  /** Stable key. The numeric code when one exists, otherwise a slug. */
  readonly id: string;
  /** Numeric DLT error code, or null for failure modes that have no code. */
  readonly code: string | null;
  /** SCREAMING_SNAKE label, stable across releases. */
  readonly label: string;
  readonly category: Category;
  /** What the error actually means, in plain English. */
  readonly meaning: string;
  /** What to do about it. */
  readonly fix: string;
  /** When this tends to hit in practice. */
  readonly whenItBites?: string;
  readonly confidence: Confidence;
  /** Gateway, operator and date, when a maintainer reproduced it. */
  readonly verifiedOn: string | null;
  readonly sources: readonly string[];
}

export interface Dataset {
  readonly schemaVersion: number;
  readonly lastReviewed: string;
  readonly confidenceLevels: Readonly<Record<Confidence, string>>;
  readonly entries: readonly Entry[];
}

export interface Meta {
  readonly schemaVersion: number;
  readonly lastReviewed: string;
  readonly confidenceLevels: Readonly<Record<Confidence, string>>;
  readonly count: number;
}

/** Look up one entry by numeric code or slug id. Undefined when unknown. */
export function lookup(code: string | number | null | undefined): Entry | undefined;

/** Every entry. Frozen. */
export function all(): readonly Entry[];

/** Entries in one category. */
export function byCategory(category: Category | string): readonly Entry[];

/** Case-insensitive substring search across label, meaning, fix and whenItBites. */
export function search(query: string): readonly Entry[];

/** Only entries reproduced first-hand by a maintainer. */
export function verified(): readonly Entry[];

/** Dataset metadata. */
export function meta(): Meta;

declare const _default: {
  lookup: typeof lookup;
  all: typeof all;
  byCategory: typeof byCategory;
  search: typeof search;
  verified: typeof verified;
  meta: typeof meta;
};
export default _default;
