/**
 * Monospace abbreviations for category chips.
 * The whole point is to *not* be an emoji — a small typographic mark
 * that reads as an editorial running-head, not as a decorative icon.
 *
 * Keys MUST match the category directory names under data/categories/
 * (which are also the `id` values in meta.toml). Mismatched keys
 * silently fall through to the 3-letter slice in CATEGORY_TAG_FOR.
 */
export const CATEGORY_TAGS: Record<string, string> = {
  animals: "anm",
  anime: "ani",
  "anti-malware": "aml",
  "art-and-design": "art",
  "authentication-and-authorization": "aut",
  blockchain: "blc",
  books: "bok",
  business: "bus",
  calendar: "cal",
  "cloud-storage-and-file-sharing": "clo",
  "continuous-integration": "ci",
  cryptocurrency: "cry",
  "currency-exchange": "fx",
  "data-validation": "val",
  development: "dev",
  dictionaries: "dic",
  "documents-and-productivity": "doc",
  email: "eml",
  entertainment: "ent",
  environment: "env",
  events: "evt",
  finance: "fin",
  "food-and-drink": "fod",
  "games-and-comics": "gam",
  geocoding: "geo",
  government: "gov",
  health: "hlt",
  jobs: "job",
  "machine-learning": "ml",
  music: "mus",
  news: "nws",
  "open-data": "oda",
  "open-source-projects": "oss",
  patent: "pat",
  personality: "psy",
  phone: "phn",
  photography: "pho",
  programming: "prg",
  "science-and-math": "sci",
  security: "sec",
  shopping: "shp",
  social: "soc",
  "sports-and-fitness": "spo",
  "test-data": "tst",
  "text-analysis": "txt",
  tracking: "trk",
  transportation: "tra",
  "url-shorteners": "url",
  vehicle: "veh",
  video: "vid",
  weather: "wth",
}

export const CATEGORY_TAG_FOR = (id: string): string =>
  CATEGORY_TAGS[id] ?? id.slice(0, 3).toLowerCase()

export const DEFAULT_PER_PAGE = 24
