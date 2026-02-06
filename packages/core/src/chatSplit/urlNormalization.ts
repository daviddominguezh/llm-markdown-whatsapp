/**
 * Replaces periods immediately after URLs with line breaks.
 * URLs never end with periods - the period is sentence punctuation that should be separated.
 * Example: "Visit https://nike.com.co. We have products" → "Visit https://nike.com.co\nWe have products"
 */
export const removePeriodsAfterURLs = (text: string): string => {
  // Match URLs (http/https/www) - allow multiple periods in domain, but capture trailing period separately
  // Pattern matches the entire URL (including all periods in the domain) followed by a period and space/end
  const urlWithPeriodPattern = /(?<url>https?:\/\/[^\s]+?|www\.[^\s]+?)\.(?<after>\s|$)/gv;

  return text.replace(
    urlWithPeriodPattern,
    (_match, url: string, afterPeriod: string) =>
      // Replace the period with a line break, preserve whatever comes after (space or end)
      `${url}\n${afterPeriod}`
  );
};
