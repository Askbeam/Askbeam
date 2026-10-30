import { describe, expect, it, vi } from 'vitest'
import plugin, { CRAWLER_HIT_UID, controllers } from './index'
import type { KoaContextLike, StrapiLike } from './types'

function fakeStrapi(config: Record<string, unknown>) {
  const create = vi.fn(async () => ({}))
  const strapi: StrapiLike = {
    plugin: () => ({ config: <T,>(key: string, fallback?: T) => (key in config ? config[key] : fallback) as T }),
    documents: (uid) => {
      expect(uid).toBe(CRAWLER_HIT_UID)
      return { create }
    },
    log: { warn: vi.fn(), info: vi.fn() },
  }
  return { strapi, create }
}

function ctx(body: unknown, secret = ''): KoaContextLike {
  return { request: { body, get: (f) => (f === 'x-geo-secret' ? secret : '') }, status: 404, body: undefined }
}

describe('strapi-plugin-geo', () => {
  it('stores verified-format hits through the Document Service', async () => {
    const { strapi, create } = fakeStrapi({ secret: 'abc', verifyIPs: false })
    const c = ctx({ path: '/docs', userAgent: 'Claude-User/1.0' }, 'abc')
    await controllers.ingest({ strapi }).ingest(c)
    expect(c.status).toBe(200)
    expect(create).toHaveBeenCalledWith({ data: expect.objectContaining({ botId: 'claude-user', purpose: 'user', path: '/docs' }) })
  })

  it('rejects requests without the secret', async () => {
    const { strapi, create } = fakeStrapi({ secret: 'abc' })
    const c = ctx({ path: '/', userAgent: 'GPTBot' })
    await controllers.ingest({ strapi }).ingest(c)
    expect(c.status).toBe(401)
    expect(create).not.toHaveBeenCalled()
  })

  it('exposes POST /ingest as a public content-api route', () => {
    expect(plugin.routes['content-api'].routes[0]).toMatchObject({ method: 'POST', path: '/ingest', handler: 'ingest.ingest' })
    expect(plugin.contentTypes['crawler-hit'].schema.info.singularName).toBe('crawler-hit')
  })
})
