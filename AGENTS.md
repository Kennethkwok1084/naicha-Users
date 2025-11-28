# Repository Guidelines

## Project Structure & Module Organization
- `miniprogram/` contains the WeChat mini program source: place reusable UI in `components/`, route-level screens in `pages/`, cross-cutting helpers in `utils/`, and business logic in `api/` and `stores/`.
- `docs/` stores product briefs such as `docs/01-prd.md` and `docs/02-todolist.md`; review relevant briefs before reshaping features.
- Type definitions live in `typings/` and should be extended there instead of duplicating types in source files.
- Co-locate assets with their owners (for example, `miniprogram/images/`).
## Always resposed on Chinese/中文
## 永远使用“如无必要不增加实体”的最小化原则
## Build, Test, and Development Commands
- Run `npm install` in the repo root to keep dependencies up to date (especially `tdesign-miniprogram`, `mobx-miniprogram`, etc.).
- Use WeChat Developer Tools for day-to-day builds:
  - **构建 npm**: `工具 > 构建 npm` to build node_modules packages (required for TDesign).
  - **编译**: Click the compile button to preview the latest code.
- Configure API base URL in `miniprogram/config/index.ts` (dev: localhost, prod: guajunyan.top).
- Use `project.private.config.json` for local environment overrides (not committed to git).

## Coding Style & Naming Conventions
- TypeScript is required; avoid `any` and declare interfaces near their usage.
- Use 2-space indentation for `.ts`, `.json`, `.wxml`, and `.wxss`; prefer PascalCase for components, camelCase for functions and props, and kebab-case for style classes.
- Shared state belongs in MobX stores (e.g., `miniprogram/stores/cartStore.ts`); keep transient screen state inside pages.
- Use `storeBindingsBehavior` from `mobx-miniprogram-bindings` to connect stores to pages/components.
- Align formatting with ESLint/Prettier settings backed by the guidelines in `docs/01-prd.md` and `docs/02-todolist.md`.

## Testing Guidelines
- Cover utilities and stores with unit tests (Vitest or `miniprogram-simulate`); add specs beside sources using the `*.spec.ts` suffix.
- Record smoke tests in WeChat Developer Tools before raising a PR and attach critical screenshots for high-risk flows (checkout, payment).
- Target at least 80% statement coverage on `utils/` and document any intentional gaps in the PR description.

## Commit & Pull Request Guidelines
- Write imperative commit subjects (`Add order polling store`) and include context plus follow-up actions in the body.
- Rebase or squash experimental commits prior to opening a PR to keep history readable.
- PRs must include: summary, linked issue or task ID, test evidence (command output or screenshots), and rollback considerations.
- Flag configuration changes under `project.config.json` or `project.private.config.json` for reviewer attention.
- Follow Conventional Commits format: `feat:`, `fix:`, `chore:`, `docs:`, etc.

## Security & Configuration Tips
- Never commit real API credentials; store secrets in local `.env.*` files and reference them through `project.private.config.json`.
- Keep token handling inside encrypted storage wrappers (`wx.getStorageSync` helpers) and redact trace IDs before logging.
