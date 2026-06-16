export const OKO_PAGE_VALUES = ["incydenty", "notatki", "zadania"] as const;
export type OkoPage = (typeof OKO_PAGE_VALUES)[number];

export const INCIDENT_TITLE_PREFIX = /^(MOVE00|PROB00|RECO00)/;

export const OKO_RECORD_ID_PATTERN = /^[a-f0-9]{32}$/i;
