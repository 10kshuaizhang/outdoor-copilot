# Outdoor Copilot

个人户外智能 — Personal Route Intelligence（V0.1）

Know the trail. Know yourself. Go smarter.

## Develop

```bash
npm install
npm run dev
npm test
npm run build
```

## Demo samples

Real GPX under `public/samples/`:

- 海坨山（北京·延庆）
- 大黑峰（张家口）
- 阳台山—妙峰山环线（北京）

## Deploy (Vercel)

```bash
npx vercel login   # or set VERCEL_TOKEN
npx vercel --prod --yes
```

Optional env vars: see `.env.example`.

Recommended: set `NEXT_PUBLIC_SITE_URL` to your production URL after first deploy.
