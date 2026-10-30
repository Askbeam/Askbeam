import { describe, expect, it, vi } from 'vitest'
import type { Config } from 'payload'
import { CRAWLER_HITS_SLUG, geoPlugin } from './index.js'

function ingestRequest(body: unknown, secret?: string) {
  const create = vi.fn(async () => ({}))
  const req = {
    headers: new Headers(secret ? { 'x-geo-secret': secret } : {}),
    json: async () => body,
    payload: { create },
  }
  return { req, create }
}

describe('geoPlugin', () => {
  const config = geoPlugin({ secret: 'abc', verifyIPs: false })({ collections: [], endpoints: [] } as unknown as Config)

  it('adds the crawler hits collection and the ingest endpoint', () => {
    expect(config.collections?.map((c) => c.slug)).toContain(CRAWLER_HITS_SLUG)
    expect(config.endpoints?.[0]).toMatchObject({ path: '/geo/ingest', method: 'post' })
  })

  it('stores hits sent by the frontend proxy', async () => {
    const { req, create } = ingestRequest({ path: '/pricing', userAgent: 'PerplexityBot/1.0' }, 'abc')
    const res = await config.endpoints![0]!.handler(req as never)
    expect(res.status).toBe(200)
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: CRAWLER_HITS_SLUG,
        overrideAccess: true,
        data: expect.objectContaining({ botId: 'perplexitybot', path: '/pricing' }),
      }),
    )
  })

  it('rejects requests with the wrong secret', async () => {
    const { req, create } = ingestRequest({ path: '/', userAgent: 'GPTBot' }, 'wrong')
    const res = await config.endpoints![0]!.handler(req as never)
    expect(res.status).toBe(401)
    expect(create).not.toHaveBeenCalled()
  })
})
