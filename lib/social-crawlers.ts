/** User-agents that fetch Open Graph previews (Telegram, WhatsApp, Twitter, etc.). */
const CRAWLER_PATTERN =
  /bot|crawler|spider|facebookexternalhit|facebot|twitterbot|linkedinbot|whatsapp|telegrambot|slackbot|discordbot|applebot|preview|embed/i;

export function isSocialCrawler(userAgent: string | null): boolean {
  if (!userAgent) return false;
  return CRAWLER_PATTERN.test(userAgent);
}
