/**
 * Known AI crawlers.
 *
 * `purpose` separates the signals the dashboard cares about:
 * - `training`: bulk crawling for model training. Means the content was collected.
 * - `search`: indexing for an AI search product. Means the content can be surfaced.
 * - `user`: a fetch made while a real user was asking the assistant a question.
 *   This is the strongest "AI used your page to answer someone" signal.
 */
export type BotPurpose = 'training' | 'search' | 'user'

export interface BotDefinition {
  /** Stable id stored with each hit, e.g. `gptbot`. */
  id: string
  /** Display name, e.g. `GPTBot`. */
  name: string
  /** Platform the bot belongs to, e.g. `OpenAI`. */
  platform: string
  purpose: BotPurpose
  /** Case-insensitive substring matched against the User-Agent. */
  uaToken: string
  /**
   * URL of the vendor's published IP ranges, in the
   * `{ prefixes: [{ ipv4Prefix } | { ipv6Prefix }] }` format.
   * Bots without a published list can only be reported as `unverifiable`.
   */
  ipRangesUrl?: string
}

export const AI_BOTS: readonly BotDefinition[] = [
  // OpenAI
  { id: 'gptbot', name: 'GPTBot', platform: 'OpenAI', purpose: 'training', uaToken: 'GPTBot', ipRangesUrl: 'https://openai.com/gptbot.json' },
  { id: 'oai-searchbot', name: 'OAI-SearchBot', platform: 'OpenAI', purpose: 'search', uaToken: 'OAI-SearchBot', ipRangesUrl: 'https://openai.com/searchbot.json' },
  { id: 'chatgpt-user', name: 'ChatGPT-User', platform: 'OpenAI', purpose: 'user', uaToken: 'ChatGPT-User', ipRangesUrl: 'https://openai.com/chatgpt-user.json' },
  // Anthropic
  { id: 'claudebot', name: 'ClaudeBot', platform: 'Anthropic', purpose: 'training', uaToken: 'ClaudeBot' },
  { id: 'claude-searchbot', name: 'Claude-SearchBot', platform: 'Anthropic', purpose: 'search', uaToken: 'Claude-SearchBot' },
  { id: 'claude-user', name: 'Claude-User', platform: 'Anthropic', purpose: 'user', uaToken: 'Claude-User' },
  // Perplexity
  { id: 'perplexitybot', name: 'PerplexityBot', platform: 'Perplexity', purpose: 'search', uaToken: 'PerplexityBot', ipRangesUrl: 'https://www.perplexity.com/perplexitybot.json' },
  { id: 'perplexity-user', name: 'Perplexity-User', platform: 'Perplexity', purpose: 'user', uaToken: 'Perplexity-User', ipRangesUrl: 'https://www.perplexity.com/perplexity-user.json' },
  // Google (Googlebot itself is classic search and intentionally not listed)
  { id: 'google-cloudvertexbot', name: 'Google-CloudVertexBot', platform: 'Google', purpose: 'training', uaToken: 'Google-CloudVertexBot' },
  // Meta
  { id: 'meta-externalagent', name: 'Meta-ExternalAgent', platform: 'Meta', purpose: 'training', uaToken: 'meta-externalagent' },
  { id: 'meta-externalfetcher', name: 'Meta-ExternalFetcher', platform: 'Meta', purpose: 'user', uaToken: 'meta-externalfetcher' },
  // Others
  { id: 'bytespider', name: 'Bytespider', platform: 'ByteDance', purpose: 'training', uaToken: 'Bytespider' },
  { id: 'amazonbot', name: 'Amazonbot', platform: 'Amazon', purpose: 'search', uaToken: 'Amazonbot' },
  { id: 'applebot', name: 'Applebot', platform: 'Apple', purpose: 'search', uaToken: 'Applebot' },
  { id: 'ccbot', name: 'CCBot', platform: 'Common Crawl', purpose: 'training', uaToken: 'CCBot' },
  { id: 'duckassistbot', name: 'DuckAssistBot', platform: 'DuckDuckGo', purpose: 'user', uaToken: 'DuckAssistBot' },
  { id: 'mistralai-user', name: 'MistralAI-User', platform: 'Mistral', purpose: 'user', uaToken: 'MistralAI-User' },
  { id: 'cohere-ai', name: 'cohere-ai', platform: 'Cohere', purpose: 'training', uaToken: 'cohere-ai' },
  { id: 'youbot', name: 'YouBot', platform: 'You.com', purpose: 'search', uaToken: 'YouBot' },
]

/**
 * Returns the AI bot a User-Agent claims to be, or `null`.
 * Longer tokens are checked first so `Claude-SearchBot` never matches a shorter token by accident.
 */
export function detectBot(
  userAgent: string | null | undefined,
  bots: readonly BotDefinition[] = AI_BOTS,
): BotDefinition | null {
  if (!userAgent) return null
  const ua = userAgent.toLowerCase()
  const sorted = [...bots].sort((a, b) => b.uaToken.length - a.uaToken.length)
  return sorted.find((bot) => ua.includes(bot.uaToken.toLowerCase())) ?? null
}
