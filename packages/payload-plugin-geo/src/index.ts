import {
  GEO_SECRET_HEADER,
  createIPVerifier,
  ingestHits,
  type HitStore,
  type IPVerifierOptions,
} from '@headless-geo/core'
import type { CollectionConfig, Config, Endpoint, Plugin } from 'payload'
import { CRAWLER_HITS_SLUG, crawlerHitsCollection } from './collection.js'

export interface GeoPluginOptions {
  /** Shared secret the frontend proxy sends. Strongly recommended when the frontend is on another host. */
  secret?: string
  /** Check crawler IPs against vendor-published ranges. Default true. */
  verifyIPs?: boolean | IPVerifierOptions
  /** Store hits whose IP does not match the claimed bot. Default true. */
  storeSpoofed?: boolean
  /** Path of the ingest endpoint under the Payload API route. Default `/geo/ingest`. */
  ingestPath?: string
  /** Customize the generated collection (labels, access, admin, ...). */
  collection?: Partial<CollectionConfig>
  /** Keep the collection and schema but stop accepting hits. Default true. */
  enabled?: boolean
}

export { CRAWLER_HITS_SLUG, crawlerHitsCollection }

export const geoPlugin =
  (options: GeoPluginOptions = {}): Plugin =>
  (config: Config): Config => {
    const verifyIPs = options.verifyIPs ?? true
    const verifier = verifyIPs ? createIPVerifier(verifyIPs === true ? {} : verifyIPs) : undefined
    const collection = crawlerHitsCollection(options.collection)

    const ingestEndpoint: Endpoint = {
      path: options.ingestPath ?? '/geo/ingest',
      method: 'post',
      handler: async (req) => {
        if (options.enabled === false) return Response.json({ ok: false, error: 'disabled' }, { status: 503 })
        let body: unknown
        try {
          body = await req.json?.()
        } catch {
          return Response.json({ ok: false, error: 'invalid json' }, { status: 400 })
        }
        const store: HitStore = {
          async save(hit) {
            await req.payload.create({ collection: collection.slug as never, data: hit as never, overrideAccess: true, req })
          },
        }
        const result = await ingestHits(body, req.headers.get(GEO_SECRET_HEADER), {
          secret: options.secret,
          verifier,
          storeSpoofed: options.storeSpoofed,
          store,
        })
        return Response.json(result.body, { status: result.status })
      },
    }

    return {
      ...config,
      collections: [...(config.collections ?? []), collection],
      endpoints: [...(config.endpoints ?? []), ingestEndpoint],
    }
  }
