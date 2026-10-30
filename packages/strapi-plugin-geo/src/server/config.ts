export interface GeoStrapiConfig {
  /** Shared secret the frontend proxy sends in `x-geo-secret`. */
  secret: string
  /** Check crawler IPs against vendor-published ranges. */
  verifyIPs: boolean
  /** Store hits whose IP does not match the claimed bot. */
  storeSpoofed: boolean
  /** Stop accepting hits without removing the content type. */
  enabled: boolean
}

export default {
  default: (): GeoStrapiConfig => ({ secret: '', verifyIPs: true, storeSpoofed: true, enabled: true }),
  validator(config: Partial<GeoStrapiConfig>) {
    if (config.secret !== undefined && typeof config.secret !== 'string') {
      throw new Error('[geo] `secret` must be a string')
    }
  },
}
