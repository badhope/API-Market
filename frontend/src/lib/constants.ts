/**
 * Monospace abbreviations for category chips.
 * The whole point is to *not* be an emoji — a small typographic mark
 * that reads as an editorial running-head, not as a decorative icon.
 */
export const CATEGORY_TAGS: Record<string, string> = {
  animals:        "anm",
  blockchain:     "blc",
  books:          "bok",
  calendar:       "cal",
  "cloud-storage":"clo",
  cryptocurrency: "cry",
  currency:       "cur",
  "data-validation":"val",
  development:    "dev",
  dictionaries:   "dic",
  documents:      "doc",
  email:          "eml",
  entertainment:  "ent",
  environment:    "env",
  finance:        "fin",
  "food-drink":   "fod",
  "games-comics": "gam",
  geocoding:      "geo",
  government:     "gov",
  health:         "hlt",
  iot:            "iot",
  jobs:           "job",
  "machine-learning":"ml",
  music:          "mus",
  news:           "nws",
  "open-data":    "oda",
  "open-source":  "oss",
  other:          "···",
  patent:         "pat",
  payment:        "pay",
  personality:    "psy",
  phone:          "phn",
  photography:    "pho",
  "science-math":"sci",
  security:       "sec",
  shopping:       "shp",
  social:         "soc",
  "sports-fitness":"spo",
  "test-data":    "tst",
  tracking:       "trk",
  transportation: "tra",
  "url-shorteners":"url",
  video:          "vid",
  weather:        "wth",
}

export const CATEGORY_TAG_FOR = (id: string): string =>
  CATEGORY_TAGS[id] ?? id.slice(0, 3).toLowerCase()

export const DEFAULT_PER_PAGE = 24
