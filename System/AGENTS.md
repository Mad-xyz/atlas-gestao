# RS Top Team — Academy Management System

## Dev Commands
- `npm run dev` — start Vite dev server
- `npm run build` — production build (outputs to `dist/`)
- `npm run lint` — ESLint flat config check
- `npm run preview` — preview production build locally
- `npm run deploy` — `npm run build && firebase deploy`

## Firebase
- **Project**: `academia-rstopteam` (default in `.firebaserc`)
- **Hosting**: site `rstopteam`, public dir `dist`, rewrites all paths to `index.html` (SPA)
- **CSP**: strict Content-Security-Policy header configured in `firebase.json`
- **No Firestore indexes file** (`firestore.indexes.json`) or security rules file (`firestore.rules`) committed yet — these are safe to create

## Firestore — Portuguese Naming
All collections, fields, and document keys are in **Portuguese**. Defined in `src/firebase/collections.js`:
- **Collections**: `usuarios`, `alunos`, `chamadas`, `presencas`, `aulas`, `cursos`, `pagamentos`, `planos`, `turmas`, `notificacoes`
- Always reference the `COLLECTIONS` constant object, never hardcode strings.

## Architecture
- **Stack**: React 19 + Vite 6 + Tailwind CSS v4 + Framer Motion + React Router v7 + Firebase v12
- **Language**: Plain JavaScript (JSX) — **no TypeScript**
- **Routing**: React Router v7 with `BrowserRouter`; all page modules lazy-loaded via `React.lazy` + `Suspense`
- **Auth**: Dual-auth architecture — main `AuthContext` (session persistence) + separate `verifyAuth` instance (`inMemoryPersistence`) for credential re-verification
- **Theme**: 6 dark-only themes, persisted in `localStorage`, injected as CSS custom properties on `:root` via `ThemeContext`
- **State**: React Context only (no Redux/Zustand); `AuthContext` + `ThemeContext` at root
- **PWA**: Service worker auto-registers at app entry via `virtual:pwa-register` (workbox); auto-update on reload
- **Offline**: Firestore offline persistence enabled (`enableIndexedDbPersistence`) in `src/firebase/config.js`
- **No test framework** configured (no Jest, Vitest, Playwright in dependencies)
- **No TypeScript** — `.jsx` files only, no `tsconfig`
- **No CI/CD** — no `.github/workflows/` directory

## Key Files
| File | Purpose |
|---|---|
| `src/main.jsx` | App entry: BrowserRouter + PWA register |
| `src/App.jsx` | Root shell: providers, lazy routes, sidebar/nav layout |
| `src/firebase/config.js` | Firebase client init + offline persistence |
| `src/firebase/collections.js` | All Firestore collection/field constants (Portuguese) |
| `src/context/AuthContext.jsx` | Auth provider (dual-auth pattern) |
| `src/context/ThemeContext.jsx` | 6 dark themes, localStorage persistence |
| `src/index.css` | Tailwind v4 `@theme` extension + global base styles |
| `vite.config.js` | Vite config: React, Tailwind v4, PWA plugins |
| `.firebaserc` | Default Firebase project = `academia-rstopteam` |
| `firebase.json` | Hosting config with rewrites + CSP headers |
| `.agents/` | Agent kit tooling (not project instructions) |
