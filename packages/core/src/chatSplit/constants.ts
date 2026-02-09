/** Minimum chunk size for merging small chunks */
export const MIN_CHUNK_SIZE = 20;

/** Maximum intro length before treating as regular content */
export const MAX_INTRO_LENGTH = 150;

/** Maximum length for question with options pattern */
export const MAX_QUESTION_WITH_OPTIONS_LENGTH = 250;

/** Short intro threshold for keeping with bullets */
export const SHORT_INTRO_THRESHOLD = 50;

/** Long question threshold for special handling */
export const LONG_QUESTION_THRESHOLD = 100;

/** Short question threshold for combining with next sentence */
export const COMBINED_LENGTH_THRESHOLD = 110;

/** Short question fragment threshold */
export const SHORT_QUESTION_FRAGMENT_THRESHOLD = 35;

/** Minimum content before section break to split */
export const MIN_CONTENT_BEFORE_BREAK = 45;

/** Short chunk threshold for anti-double-split */
export const SHORT_CHUNK_THRESHOLD = 50;

/** Current text short threshold for anti-double-split */
export const CURRENT_TEXT_SHORT_THRESHOLD = 150;

/** Average item length threshold for list splitting */
export const AVG_ITEM_LENGTH_THRESHOLD = 70;

/** Maximum items for splitting long list items */
export const MAX_ITEMS_FOR_LONG_SPLIT = 3;

/** Maximum number for list item detection */
export const MAX_LIST_NUMBER = 20;

/** First newline search limit */
export const FIRST_NEWLINE_SEARCH_LIMIT = 100;

/** Maximum distance after question for response options check */
export const DOUBLE_NEWLINE_DISTANCE_THRESHOLD = 5;

/** Index offset for 1-based counting */
export const INDEX_OFFSET = 1;

/** Zero constant for explicit zero checks */
export const ZERO = 0;
