# AGENT_EVALUATION — QA Criteria for Finance App Agents

## Required Checks

| Check | Expected |
|---|---|
| Agent files exist | PASS |
| Skill files exist with YAML front matter | PASS |
| Agent map/sequence/tool/memory docs exist | PASS |
| Runtime route has deterministic fallback | PASS |
| Missing data returns safe message | PASS |
| AI output is JSON parseable | PASS |
| No agent has write permission | PASS |

## Per-Agent Evaluation

### AI Finance Agent
- Reads dashboard/report summary only.
- Must mention missing sources.
- Must not invent P&L when sources are missing.

### AI Cashbook Agent
- Must analyze cashflow when `DL_SO_QUY` exists.
- Must flag unusual large expenses.
- Must not call cashbook revenue final P&L revenue.

### AI Import Validation Agent
- Must clearly say confirm or do not confirm.
- Must mention error/duplicate/mismatch row counts.
- Must not modify data.

### AI Forecast Agent
- Must reject forecast if history < 4 weeks.
- Must not create forecast numbers.
- Must explain code-generated scenarios only.

### AI Accountant Workbench Agent
- Must create action list with owner/deadline/evidence.
- Must not create tasks without data evidence.

## Release Gate

Before release:

```bash
npm run agent-check
npm run typecheck
npm run lint
npm run test
npm run static-ui-qa
npm run kiem-tra-schema
npm run smoke
npm run vercel-build
```


## V5.0 Forecast Agent Evaluation

- Nếu lịch sử < 4 tuần: phải trả `Chưa đủ dữ liệu để lập dự toán`.
- Nếu dùng proxy từ Sổ quỹ: phải ghi `Cần đối chiếu`.
- Có đủ dữ liệu: phải có đủ 3 kịch bản.
- Forecast Agent không được tự tạo số ngoài calculation engine.
- Không ghi `DU_TOAN_TUAN_TOI` trong V5.0.
