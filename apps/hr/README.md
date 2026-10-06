# somion-hr-dashboard

Somion HR dashboard: a [Next.js](https://nextjs.org) app with [next-intl](https://next-intl-docs.vercel.app/) for locales `en`, `de`, `fr`, and `it` (see `i18n/routing.ts`).

## Getting started

Install dependencies and run the dev server:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — routing redirects to the default locale (`en`). Pages live under `app/[locale]/`; start from `app/[locale]/page.tsx`.

Other package managers: `yarn dev`, `pnpm dev`, or `bun dev`.

## Scripts

- `npm run dev` — development server
- `npm run build` — production build
- `npm run start` — run production server after `build`

## Repository

Remote: [https://gitlab.com/somion/somion-hr-dashboard.git](https://gitlab.com/somion/somion-hr-dashboard.git)

## Learn more

- [Next.js documentation](https://nextjs.org/docs)
- [Learn Next.js](https://nextjs.org/learn)
- [Next.js deployment](https://nextjs.org/docs/app/building-your-application/deploying)
