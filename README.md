# Headless GEO

Make headless sites visible to AI, and see in your CMS which AI crawlers read which pages.

This first release does one thing: **AI crawler logs**. It records visits from GPTBot, ClaudeBot,
PerplexityBot, ChatGPT-User and others, checks their IPs against the vendors' published ranges,
and separates three kinds of visits:

| Purpose | Bots | What it tells you |
| --- | --- | --- |
| `training` | GPTBot, ClaudeBot, CCBot, Bytespider... | Your content was collected for model training |
| `search` | OAI-SearchBot, Claude-SearchBot, PerplexityBot... | Your content is indexed by an AI search product |
| `user` | ChatGPT-User, Claude-User, Perplexity-User... | A real person asked an AI a question and it opened your page |

## Packages

| Package | What it is |
| --- | --- |
| [`@headless-geo/core`](packages/geo-core) | CMS-agnostic: bot list, IPv4/IPv6 CIDR matching, IP verification, ingest logic |
| [`@headless-geo/next`](packages/geo-next) | Frontend SDK: a Next.js proxy / middleware that reports AI crawler requests to your CMS |
| [`payload-plugin-geo`](packages/payload-plugin-geo) | Payload 3 adapter: `geo-crawler-hits` collection + `POST /api/geo/ingest` |
| [`strapi-plugin-geo`](packages/strapi-plugin-geo) | Strapi 5 adapter: `plugin::geo.crawler-hit` content type + `POST /api/geo/ingest` |

A headless CMS never sees the requests to your frontend, so the frontend reports them:

```
AI crawler ──▶ Next.js proxy (@headless-geo/next) ──waitUntil──▶ CMS /api/geo/ingest ──▶ your database
                 detects bot, does not block the page            re-checks UA, verifies IP
```

## Payload

```ts
// payload.config.ts
import { geoPlugin } from 'payload-plugin-geo'

export default buildConfig({
  plugins: [geoPlugin({ secret: process.env.GEO_SECRET })],
})
```

```ts
// proxy.ts (Next 16) or middleware.ts (Next 15), in the same app
import { withGeo } from '@headless-geo/next'

export const proxy = withGeo({ endpoint: '/api/geo/ingest', secret: process.env.GEO_SECRET })
```

## Strapi

```js
// config/plugins.js
module.exports = ({ env }) => ({
  geo: { enabled: true, config: { secret: env('GEO_SECRET') } },
})
```

```ts
// In your Next.js frontend: proxy.ts or middleware.ts
import { withGeo } from '@headless-geo/next'

export const proxy = withGeo({
  endpoint: 'https://cms.example.com/api/geo/ingest',
  secret: process.env.GEO_SECRET,
})
```

Already have middleware? Wrap it: `withGeo(options, yourMiddleware)`.
`@headless-geo/next` only uses Fetch APIs, so `trackAICrawler(request, ctx, options)` also works in a Cloudflare Worker.

## IP verification

Each hit is stored with `verification`:

- `verified`: IP is inside the vendor's published list (OpenAI, Perplexity)
- `spoofed`: vendor publishes a list and the IP is not in it, so the User-Agent is fake
- `unverifiable`: no published list (e.g. Anthropic), the list could not be fetched, or no IP

Lists are fetched by the CMS, cached for 24 hours, and a stale list is kept if a refresh fails.
Add your own ranges with `verifyIPs: { staticRanges: { claudebot: ['x.x.x.x/24'] } }` (Payload).

## Development

```sh
npm install
npm run build   # core first, then the rest
npm test
npm run typecheck
```

## Roadmap

1. AI crawler logs (this release)
2. `llms.txt`, `llms-full.txt`, Markdown versions of each page
3. JSON-LD from config presets (Article, FAQ)
4. Admin dashboard: AI visits by platform, live user fetches, pages never crawled

## License

MIT
