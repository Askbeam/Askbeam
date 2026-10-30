import { GEO_SECRET_HEADER, createIPVerifier, ingestHits, type IPVerifier } from '@headless-geo/core'
import config, { type GeoStrapiConfig } from './config'
import crawlerHitSchema from './content-types/crawler-hit/schema'
import type { KoaContextLike, StrapiLike } from './types'

export const CRAWLER_HIT_UID = 'plugin::geo.crawler-hit'

let verifier: IPVerifier | undefined

function getConfig(strapi: StrapiLike): GeoStrapiConfig {
  const plugin = strapi.plugin('geo')
  return {
    secret: plugin.config('secret', ''),
    verifyIPs: plugin.config('verifyIPs', true),
    storeSpoofed: plugin.config('storeSpoofed', true),
    enabled: plugin.config('enabled', true),
  }
}

export const controllers = {
  ingest: ({ strapi }: { strapi: StrapiLike }) => ({
    async ingest(ctx: KoaContextLike) {
      const cfg = getConfig(strapi)
      if (!cfg.enabled) {
        ctx.status = 503
        ctx.body = { ok: false, error: 'disabled' }
        return
      }
      const result = await ingestHits(ctx.request.body, ctx.request.get(GEO_SECRET_HEADER) || null, {
        secret: cfg.secret || undefined,
        verifier: cfg.verifyIPs ? (verifier ??= createIPVerifier()) : undefined,
        storeSpoofed: cfg.storeSpoofed,
        store: {
          async save(hit) {
            await strapi.documents(CRAWLER_HIT_UID).create({ data: { ...hit } })
          },
        },
      })
      ctx.status = result.status
      ctx.body = result.body
    },
  }),
}

export const routes = {
  'content-api': {
    type: 'content-api',
    routes: [
      {
        method: 'POST',
        path: '/ingest',
        handler: 'ingest.ingest',
        // Authenticated by the shared secret instead of an API token, so the proxy needs no Strapi token.
        config: { auth: false, policies: [] },
      },
    ],
  },
}

export default {
  config,
  contentTypes: { 'crawler-hit': { schema: crawlerHitSchema } },
  controllers,
  routes,
  register() {},
  bootstrap({ strapi }: { strapi: StrapiLike }) {
    if (!getConfig(strapi).secret) {
      strapi.log.warn('[geo] No secret configured: anyone can post crawler hits to /api/geo/ingest.')
    }
  },
}
