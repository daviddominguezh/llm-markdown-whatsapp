import { AVG_ITEM_LENGTH_THRESHOLD, MAX_ITEMS_FOR_LONG_SPLIT } from './constants.js';
import { findListSection } from './sections.js';
import type { SplitResult } from './splitProcessors.js';

/** Huge item length threshold */
const HUGE_ITEM_LENGTH = 150;

/** Zero constant for comparisons */
const ZERO = 0;

/**
 * Processes numbered list items
 */
function processNumberedList(
  listText: string,
  afterList: string,
  chunks: string[]
): SplitResult {
  const items = listText.split(/\n(?=\d{1,2}\.\s+)/v).filter((item) => item.trim().length > ZERO);

  const hasHugeItems = items.some((item) => item.length > HUGE_ITEM_LENGTH);
  const avgItemLength = items.reduce((sum, item) => sum + item.length, ZERO) / items.length;
  const hasLongItems = avgItemLength > AVG_ITEM_LENGTH_THRESHOLD;

  if (hasHugeItems || (hasLongItems && items.length <= MAX_ITEMS_FOR_LONG_SPLIT)) {
    items.forEach((item) => {
      const trimmedItem = item.trim();
      if (trimmedItem.length > ZERO) {
        chunks.push(trimmedItem);
      }
    });
  } else {
    chunks.push(listText.trim());
  }

  return { splitFound: true, newRemainingText: afterList.trim() };
}

/**
 * Processes bullet list items
 */
function processBulletList(
  listText: string,
  afterList: string,
  chunks: string[]
): SplitResult {
  const items = listText.split(/\n(?=[\-•]\s+)/v).filter((item) => item.trim().length > ZERO);
  const hasHugeItems = items.some((item) => item.length > HUGE_ITEM_LENGTH);

  if (hasHugeItems) {
    items.forEach((item) => {
      const trimmedItem = item.trim();
      if (trimmedItem.length > ZERO) {
        chunks.push(trimmedItem);
      }
    });
  } else {
    chunks.push(listText.trim());
  }

  return { splitFound: true, newRemainingText: afterList.trim() };
}

/**
 * Processes list sections
 */
export function processListSection(remainingText: string, chunks: string[]): SplitResult {
  const listSection = findListSection(remainingText);

  if (listSection === null) {
    return { splitFound: false, newRemainingText: remainingText };
  }

  const listText = remainingText.substring(listSection.start, listSection.end);
  const afterList = remainingText.substring(listSection.end);

  if (listSection.type === 'numbered') {
    return processNumberedList(listText, afterList, chunks);
  }

  return processBulletList(listText, afterList, chunks);
}
