# Repository Guidelines

## Project Structure & Module Organization
- `miniprogram/` contains the WeChat mini program source: place reusable UI in `components/`, route-level screens in `pages/`, and cross-cutting helpers in `utils/`.
- `docs/` stores product briefs such as `docs/FRONTEND_PROMPT.md`; review relevant briefs before reshaping features.
- Type definitions live in `typings/` and should be regenerated or extended there instead of duplicating types in source files.
- Co-locate assets and tests with their owners (for example, `pages/menu/assets/` or `components/ProductCard/ProductCard.spec.ts`).
## Always resposed on Chinese/中文
## 永远使用“如无必要不增加实体”的最小化原则
## Build, Test, and Development Commands
- Run `npm install` in the repo root to keep TypeScript tool‑chain packages up to date.
- Use WeChat Developer Tools for day-to-day builds: `工具 > 构建 npm` and `编译` to preview the latest code.
- Point the simulator at your FastAPI dev server by editing `project.private.config.json` (e.g., `https://localhost:8000` during local runs).
- When you add CLI workflows, expose them in `package.json` (for example, `"dev": "taro build --type weapp --watch"` or `"lint": "eslint \"miniprogram/**/*.ts\""`).

## Coding Style & Naming Conventions
- TypeScript is required; avoid `any` and declare interfaces near their usage.
- Use 2-space indentation for `.ts`, `.json`, and `.wxss`; prefer PascalCase for components, camelCase for functions and props, and kebab-case for style classes.
- Shared state belongs in MobX stores (e.g., `miniprogram/stores/cartStore.ts`); keep transient screen state inside pages.
- Align formatting with ESLint/Prettier settings backed by the guidelines in `docs/FRONTEND_PROMPT.md`.

## Testing Guidelines
- Cover utilities and stores with unit tests (Vitest or `miniprogram-simulate`); add specs beside sources using the `*.spec.ts` suffix.
- Record smoke tests in WeChat Developer Tools before raising a PR and attach critical screenshots for high-risk flows (checkout, payment).
- Target at least 80% statement coverage on `utils/` and document any intentional gaps in the PR description.

## Commit & Pull Request Guidelines
- Write imperative commit subjects (`Add order polling store`) and include context plus follow-up actions in the body.
- Rebase or squash experimental commits prior to opening a PR to keep history readable.
- PRs must include: summary, linked issue or task ID, test evidence (command output or screenshots), and rollback considerations.
- Flag configuration changes under `project.config.json` or `project.private.config.json` for reviewer attention.

## Security & Configuration Tips
- Never commit real API credentials; store secrets in local `.env.*` files and reference them through `project.private.config.json`.
- Keep token handling inside encrypted storage wrappers (`wx.getStorageSync` helpers) and redact trace IDs before logging.
