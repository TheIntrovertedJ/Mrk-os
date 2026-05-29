# Mrk-os

A modern Next.js app using Clerk authentication and shadcn-inspired UI utilities.

## Project Summary

This repository includes:
- Next.js `16.2.4` with the App Router
- React `19.2.4`
- TypeScript support
- Clerk authentication via `@clerk/nextjs`
- Tailwind CSS v4 with `@tailwindcss/postcss`
- Shared UI components under `components/ui/`
- Lightweight styling helpers like `clsx` and `class-variance-authority`

## Authentication

Clerk auth pages are configured as catch-all App Router routes:
- `app/sign-in/[[...rest]]/page.tsx`
- `app/sign-up/[[...rest]]/page.tsx`

This structure matches Clerk’s recommended App Router setup and avoids route protection issues with sign-in/sign-up flows.

## Getting Started

1. Install dependencies

```bash
npm install
```

2. Run the development server

```bash
npm run dev
```

3. Open the app

```bash
http://localhost:3000
```

## Available Scripts

- `npm run dev` — start the Next.js development server
- `npm run build` — build the production app
- `npm start` — start the built app
- `npm run lint` — run ESLint checks

## Project Structure

- `app/`
  - `page.tsx` — home page
  - `sign-in/[[...rest]]/page.tsx` — Clerk sign-in route
  - `sign-up/[[...rest]]/page.tsx` — Clerk sign-up route
- `components/ui/` — shared UI components
- `lib/` — application utilities
- `public/` — static assets
- `next.config.ts` — Next.js configuration
- `tsconfig.json` — TypeScript configuration

## Notes

- Ensure Clerk environment variables are configured before deployment.
- The home page currently renders the `SignIn` component for demo purposes.
- Avoid protecting the Clerk catch-all auth routes with middleware.

## Learn More

- Next.js: https://nextjs.org/docs
- Clerk: https://clerk.com/docs
- shadcn/ui: https://ui.shadcn.com
