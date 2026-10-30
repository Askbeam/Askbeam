// Minimal structural types for the parts of Strapi 5 this plugin touches,
// so the plugin builds without pulling in @strapi/strapi.
export interface StrapiLike {
  plugin(name: string): { config<T = unknown>(key: string, defaultValue?: T): T }
  documents(uid: string): { create(params: { data: Record<string, unknown> }): Promise<unknown> }
  log: { warn(message: string): void; info(message: string): void }
}

export interface KoaContextLike {
  request: { body?: unknown; get(field: string): string }
  status: number
  body: unknown
}
