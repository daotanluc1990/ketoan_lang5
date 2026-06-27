# QA_REPORT_V4_8_1_AGENT_SKILL_MAP

## Scope

V4.8.1 chuẩn hóa Agent/Skill Map cho Finance App sau V4.8 Import Control & Rollback. Bản này không ghi Google Sheet, không import dữ liệu thật, không thay đổi dữ liệu production.

## What changed

- Added specialized runtime agent files:
  - `.agents/AI_IMPORT_VALIDATION_AGENT.md`
  - `.agents/AI_CASHBOOK_AGENT.md`
  - `.agents/AI_FORECAST_AGENT.md`
  - `.agents/AI_ACCOUNTANT_WORKBENCH_AGENT.md`
- Added specialized skills:
  - `.agents/skills/finance-cashbook-analysis-skill/SKILL.md`
  - `.agents/skills/import-validation-skill/SKILL.md`
  - `.agents/skills/finance-report-engine-skill/SKILL.md`
  - `.agents/skills/forecast-budget-skill/SKILL.md`
  - `.agents/skills/production-qa-finance-app-skill/SKILL.md`
- Added agent blueprints:
  - `docs/AGENT_BLUEPRINTS/02_ai_import_validation_agent.md`
  - `docs/AGENT_BLUEPRINTS/03_ai_cashbook_agent.md`
  - `docs/AGENT_BLUEPRINTS/04_ai_forecast_agent.md`
  - `docs/AGENT_BLUEPRINTS/05_ai_accountant_workbench_agent.md`
- Updated:
  - `docs/AGENT_MAP.md`
  - `docs/AGENT_SEQUENCE.md`
  - `docs/AGENT_TOOL_MAP.md`
  - `docs/AGENT_MEMORY_MAP.md`
  - `docs/AGENT_EVALUATION.md`
- Added deterministic routing registry:
  - `src/lib/ai/agent-map.ts`
- Added read-only agent map API:
  - `app/api/ai/agents/route.ts`
- Added tests:
  - `src/lib/ai/__tests__/agent-map.test.ts`
- Updated `scripts/check-agent-structure.mjs` to enforce all new agent/skill/map files.
- Added `experimental.cpus = 1` in `next.config.ts` to keep Vercel/Next static generation stable in constrained environments.
- Added `dynamic = force-dynamic` to legacy redirect pages to avoid unnecessary static generation.

## Data Safety

- No Google Sheet write.
- No production import.
- No rollback call.
- No synthetic fixture packaged.
- Agents remain read-only: `writePermission = none`.

## QA Commands

| Command | Result |
|---|---|
| `npm run agent-check` | PASS |
| `npm run typecheck` | PASS |
| `npm run lint` | PASS |
| `npm run test` | PASS — 8 files, 20 tests |
| `npm run synthetic-data-qa` | PASS |
| `npm run static-ui-qa` | PASS |
| `npm run kiem-tra-schema` | PASS — 21 sheets |
| `npm run smoke` | PASS |
| `NEXT_TELEMETRY_DISABLED=1 npm run vercel-build` | PASS |

## Build Notes

Turbopack still reports one known warning because `src/lib/ai/agent.ts` reads `.agents/AI_FINANCE_AGENT.md` from filesystem. This warning existed in prior releases and does not fail build. The design is intentional because the owner wants agent prompts as standalone markdown files.

## Runtime Test After Deploy

Open:

```text
/api/ai/agents
/api/ai/agents?intent=phân%20tích%20sổ%20quỹ
/api/ai/agents?intent=kiểm%20tra%20import%20bị%20trùng
/api/ai/agents?intent=lập%20dự%20toán%20tuần%20tới
```

Expected:

- `ok = true`
- `agents.length = 5`
- Sổ quỹ routes to `cashbook`
- Import routes to `import_validation`
- Dự toán routes to `forecast`
- All selected agents have `writePermission = none`

## Definition of Done

V4.8.1 is ready for Preview/Staging redeploy.
