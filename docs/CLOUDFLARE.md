# Cloudflare deployment handoff

The game deploys to **Workers Static Assets**, using `wrangler.jsonc`. It needs no
Worker script, database, R2 bucket, KV namespace, or application secrets. Only
`dist/` is published. The game ships as a directory of ES modules, fonts, artwork and the compiled rasterizer.

## Local bot: first deployment

1. Check out this change and install Node 24 and Python 3.10+.
2. Run `npm ci`, `npm run build`, `npm test`, `npm run test:render`,
   `npm run test:canvas`, and `npm run deploy:check`.
3. Select the intended Cloudflare account. Supply `CLOUDFLARE_ACCOUNT_ID` and a
   scoped `CLOUDFLARE_API_TOKEN` through your secret manager/environment. The token
   needs Account > Workers Scripts > Edit for that account. Alternatively, use
   `npx wrangler login` interactively. Never commit credentials.
4. Review the Worker name in `wrangler.jsonc` for collisions with existing services.
   Run `npm run deploy`. Wrangler rebuilds the HTML before uploading it.
5. Open the workers.dev URL printed by Wrangler and complete the checks below.

`npm run dev:cloudflare` previews the site with the local Cloudflare runtime.
`npm run deploy:check` rebuilds and performs a credential-free Wrangler dry run;
it does not publish anything. Compatibility date is deliberately fixed and can
be advanced separately after validation.

## GitHub automation

The Cloudflare workflow validates PRs and pushes to main without credentials.
It also checks that committed `dist/index.html` matches the source build.
Production deployment is initially disabled.

Configure these GitHub repository settings after the first successful deployment:

| Setting | Kind | Value |
| --- | --- | --- |
| `CLOUDFLARE_API_TOKEN` | Actions secret | Account-scoped deployment token |
| `CLOUDFLARE_ACCOUNT_ID` | Actions secret | Target account ID |
| `CLOUDFLARE_DEPLOY_ENABLED` | Actions repository variable | `true` |

Review the `production` GitHub environment and add protection rules if desired.
Once enabled, successful main builds deploy automatically. To deploy an existing
main commit, run the Cloudflare workflow manually with main selected. PRs never
deploy, and manual runs from other branches only validate. Set the enable variable
to `false` to stop future automatic deployments. Do not also configure Cloudflare
Git builds for this same Worker: use one production deployment owner.

## Canonical domain

Choose a hostname in an active Cloudflare DNS zone in the target account. Add a
Custom Domain for this Worker, then record it in the Wrangler configuration so
future deploys preserve it:

```jsonc
"routes": [
  { "pattern": "YOUR_GAME_HOSTNAME", "custom_domain": true }
]
```

Replace the placeholder with the real hostname before deploying. Domain setup may
need additional zone permissions; handle that separately from the routine deploy
token. Verify HTTPS before changing the README play link. The existing link stays
in place until the new address is live. Redirecting the old ChatGPT-hosted address
requires control of that host; Cloudflare cannot configure that redirect for it.

## Release checks and rollback

- Load `/` and verify HTML delivery, then check a missing path returns 404.
- Drive a race through the finish, check audio after user interaction, and inspect
  all seven trucks. Check Safari and Chrome with real WebGL; the automated rendering
  suite covers the software and Canvas paths, not real GPU rendering.
- Save settings, reload, and verify persistence. The key is
  `mtm96-offroad-racing-1`; localStorage is origin-specific. Existing records on the
  old hostname do not transfer automatically. No save migration is included.
- Confirm the deployed build corresponds to the intended GitHub commit.

For rollback, select the previous deployment in Cloudflare or use
`npx wrangler rollback <VERSION_ID>`. Disable automatic deployment first if needed
and revert the bad source commit before re-enabling it.

The distribution is about 7 MB across roughly 60 files; Workers allows 25 MiB per
static asset and 20,000 files per version (free tier). Do not apply a strict CSP
without testing inline styles and the WASM loader.

## First load, caching and version skew

The distribution loads as about 35 requests: the HTML shell, `three.min.js`, then
the ES module graph. `index.html` carries `modulepreload` links for `app.js`'s
twelve direct imports, which collapses the module discovery waterfall (Chrome
fetches the whole reachable graph in parallel; Safari and Firefox preload the
listed files one level ahead). Verified MIME types from the asset pipeline:
`.js` serves as `text/javascript`, `.wasm` as `application/wasm`, so module
scripts and streaming WASM instantiation work without a Worker script.

Caching stays at the Cloudflare default (`Cache-Control: max-age=0,
must-revalidate` with an `ETag` per file). Repeat visits revalidate every module
instead of trusting a TTL. That is deliberate: game files are not content-hashed,
so any `max-age` would serve stale code to a visitor mid-session after a deploy.
The `_headers` file emitted by `tools/build.py` adds only `X-Content-Type-Options:
nosniff` and `Referrer-Policy: no-referrer`. If load latency ever demands longer
cache, introduce hashed filenames first, then raise `max-age` for them.

Version skew between the HTML shell and module files can occur during a deploy
(Cloudflare documents this for all static-asset Workers). It is benign here:
module filenames are stable, so an old shell requesting a renamed module is the
only breaking case, and renames should be avoided for that reason. A hard
refresh always resolves to a consistent version.

References: [Static assets](https://developers.cloudflare.com/workers/static-assets/),
[Wrangler](https://developers.cloudflare.com/workers/wrangler/),
[Custom domains](https://developers.cloudflare.com/workers/configuration/routing/custom-domains/).
