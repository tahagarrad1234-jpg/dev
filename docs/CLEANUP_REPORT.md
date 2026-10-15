# Rapport de Nettoyage et Audit de Code Mort (`CLEANUP_REPORT.md`)

Ce rapport résume les actions de nettoyage effectuées lors de la phase 1 du projet **AMAL Watches** (`dev-main`).

---

## 1. Synthèse Globale

- **Total fichiers supprimés** : ~65 fichiers sources et configurations inutiles.
- **Répertoires supprimés** : 5 répertoires complets (`artifacts/mockup-sandbox`, `attached_assets`, `lib/api-spec`, `lib/api-zod`, `lib/api-client-react`).
- **Composants UI taillés** : 45 composants shadcn/ui non référencés supprimés.
- **Résultat sur le build** : `pnpm run build` qui échouait auparavant s'exécute désormais avec succès en 3.5s.

---

## 2. Détail des Suppressions et Justifications

| Fichier / Répertoire | Raison de la suppression | Statut / Impact |
| :--- | :--- | :--- |
| `artifacts/mockup-sandbox/` (entier) | Doublon inutilisé du frontend Replit sandbox. Bloquait `pnpm build` car `PORT` était requis dans son `vite.config.ts`. | Supprimé sans régression. |
| `attached_assets/Pasted-*.txt` | Résidu de collage de template HTML brut lors du développement initial. | Supprimé. |
| `lib/api-spec/` | Spécification OpenAPI Orval ne contenant qu'une route santé `/healthz`. | Supprimé. |
| `lib/api-zod/` | Schémas Zod générés depuis OpenAPI contenant uniquement le type de santé `/healthz`. | Supprimé. |
| `lib/api-client-react/` | Hooks React Query générés par Orval, importés nulle part dans `App.tsx` ou les pages. | Supprimé. |
| `lib/db/_probe.cjs` & `_tables.cjs` | Scripts de diagnostic temporaires utilisés pour tester la connexion pooler Postgres. | Supprimé. |
| `artifacts/premium-watch-shop/src/components/ui/*` (45 fichiers) | Composants shadcn/ui générés mais jamais importés dans l'application (ex: `accordion`, `calendar`, `chart`, `menubar`, `sidebar`, `table`, etc.). | 10 composants conservés (`button`, `card`, `dialog`, `input`, `label`, `separator`, `badge`, `toast`, `toaster`, `tooltip`). |

---

## 3. Dépendances et Références Workspace Nettoyées

1. **`artifacts/api-server/package.json`** :
   - Retrait de `@workspace/api-zod`.
   - Simplification de la route `/healthz` pour retourner directement `{ status: "ok" }`.
2. **`artifacts/premium-watch-shop/package.json`** :
   - Retrait de `@workspace/api-client-react`.
3. **`tsconfig.json` (racine & packages)** :
   - Nettoyage des références TS vers les packages `lib/api-*` supprimés.

---

## 4. Vérification après Nettoyage

- `pnpm run typecheck` : **0 erreur** (validation stricte réussie sur tous les projets restants).
- `pnpm run build` : **Succès** (compilation frontend Vite + backend esbuild sans erreur).
