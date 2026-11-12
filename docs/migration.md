# Upgrading to the expansion release (after 0.3.0)

## New package names (0.5.0)

From 0.5.0 the packages are published under the `@askbeam` scope. The old names are no longer on npm.

| Old name | New name |
| --- | --- |
| `@garus-ltd/geo-core` | `@askbeam/core` |
| `@garus-ltd/geo-dashboard` | `@askbeam/dashboard` |
| `@garus-ltd/geo-next` | `@askbeam/next` |
| `payload-plugin-geo` | `@askbeam/payload-plugin` |
| `strapi-plugin-geo` | `@askbeam/strapi-plugin` |

To switch, uninstall the old packages, install the new ones and update your imports. Nothing else changes: the
Strapi plugin is still configured under `geo` in `config/plugins.js`, and the database collections, content types,
routes and options keep their names. Payload: run `payload generate:importmap` afterwards, because the admin
components are now referenced as `@askbeam/payload-plugin/client`.

## Compatibility

| Package | Tested with | Supported range |
| --- | --- | --- |
| `@askbeam/payload-plugin` | Payload 3.92.1, Next.js 16.3.3, SQLite | Payload `^3` (3.x with collection hooks and `payload.count`) |
| `@askbeam/strapi-plugin` | Strapi 5.60.0, SQLite | Strapi `^5` (Document Service middlewares) |
| `@askbeam/next` | Next.js 15 / 16, Astro 7.4.1, Nuxt 4.6.2, Node 22 | Any runtime with Fetch API `Request` / `Response` and WebCrypto (Node ≥ 20, edge runtimes) |
| `@askbeam/core` | Node 22 | Node ≥ 20 |

The CMS plugins pin `@askbeam/core` to the same version; upgrade all packages together.

## What changes on upgrade

Nothing new is switched on by default. Without new options the public outputs are the same as before, with two
visible differences:

- llms.txt / llms-full.txt read entries 100 per query instead of in one query. Same entries, same order.
- When a source has more public entries than its `limit`, its section now says "Lists N of M entries".

New storage:

| CMS | New | When |
| --- | --- | --- |
| Payload | collection `geo-jobs` (cleanup / export records) | always |
| Payload | collection `geo-invalidations` (cache notice deliveries) | only with `invalidation` |
| Strapi | content type `plugin::geo.job` (table `geo_jobs`) | always registered |
| Strapi | content type `plugin::geo.invalidation` (table `geo_invalidations`) | always registered, written only with `invalidation` |

New routes: Payload `/api/geo/llms/:file` (only with `segments`), `/api/geo/data*`, `/api/geo/invalidations*`
(only with `invalidation`); Strapi content API `/api/geo/llms/:file` (404 unless `segments`), admin `/geo/data*`,
`/geo/invalidations*`. Admin routes need a logged-in admin; public routes serve only public content.

## Steps

1. Back up the database.
2. Upgrade all Askbeam packages to the same version.
3. Payload with Postgres: `npx payload migrate:create geo-expansion` then `npx payload migrate`. SQLite / MongoDB
   in development push the schema on start; in production create a migration the same way. Then
   `npx payload generate:importmap` (the dashboard client component gained the Data tab).
4. Strapi: restart; Strapi creates the new tables. Rebuild the admin (`strapi build`) for the Data tab.
5. Optional: turn on what you need: `segments`, `invalidation`, `retention`, presets in `jsonLd`, converters,
   rules, bots. See [config-reference.md](config-reference.md).

## Rollback

1. Reinstall the previous versions of all packages (`npm install @askbeam/payload-plugin@<previous> …`).
   0.5.0 is the first release under `@askbeam`; versions before it are no longer on npm.
2. The new tables are not read by older versions and can stay. To remove them: Payload, create a migration after
   downgrading (it drops `geo_jobs` / `geo_invalidations`); Strapi, `DROP TABLE geo_jobs; DROP TABLE
   geo_invalidations;` after the downgrade (Strapi doesn't drop tables of removed content types itself).
3. Frontend: remove `llmsSegmentRoute`, `revalidationHandler` and `geoFetchHandler` routes if you added them; an
   older geo-next doesn't export them.
4. If `segments` was on, `/llms.txt` returns to a single file; links to `/llms/<part>.txt` start returning 404
   (cached for at most `notFoundMaxAge`).

Deleted rows (cleanup) are not restored by a rollback; restore them from the backup.
