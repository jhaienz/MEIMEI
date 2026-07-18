/** Kiosk-wide tuning values. Client-safe — no database or Node imports. */

/** Free-text Names go on a public screen at a fair. The cap is what stops a wall of text. */
export const NAME_MAX_LENGTH = 24;

export const PERSONA_QUESTION_COUNT = 12;

export const KNOWLEDGE_QUESTION_COUNT = 12;

/** Thirty seconds per Knowledge Round question. Timeout counts as wrong (ADR-0007). */
export const KNOWLEDGE_SECONDS = 30;

/**
 * How long a half-finished run sits untouched before the kiosk gives up on it and returns
 * to the boards, writing nothing.
 *
 * This is not a question timer and is never shown: the Persona Round is untimed, and a
 * visible countdown there would corrupt the honest answer we match on (ADR-0006). It is
 * only how an abandoned run stops wedging the kiosk for the next student. Three minutes of
 * *zero* interaction means the student left — a realistic answer takes a few seconds.
 */
export const ABANDON_IDLE_MS = 180_000;

export const RANK_BOARD_SIZE = 10;
