# AGENT_MAP — Cơm Tấm Làng CEO Report Dashboard

## Active Runtime Agents

| Agent | File | Primary Purpose | Runtime Status | Main UI/API |
|---|---|---|---|---|
| AI Finance Agent | `.agents/AI_FINANCE_AGENT.md` | Phân tích tổng hợp cho CEO: tài chính, vận hành, dữ liệu thiếu, rủi ro | Active | `/api/ai/report-analysis` |
| AI Import Validation Agent | `.agents/AI_IMPORT_VALIDATION_AGENT.md` | Giải thích preview/confirm import, lỗi/trùng/lệch, khuyến nghị confirm | Mapped | `/api/import/preview`, `/api/import/confirm` |
| AI Cashbook Agent | `.agents/AI_CASHBOOK_AGENT.md` | Phân tích Sổ quỹ, dòng tiền, top thu/chi, chi bất thường | Mapped | Dashboard, Dòng tiền |
| AI Forecast Agent | `.agents/AI_FORECAST_AGENT.md` | Giải thích dự toán do calculation engine tạo; không tự tạo số | Active | `/api/reports/du-toan`, `/api/ai/forecast-analysis` |
| AI Accountant Workbench Agent | `.agents/AI_ACCOUNTANT_WORKBENCH_AGENT.md` | Tạo checklist việc kế toán từ cảnh báo/dữ liệu thiếu/import issues | Mapped | Bàn làm việc kế toán |
| Production App Builder Agent | `AGENTS.md` | Quy chuẩn triển khai app production cho owner không kỹ thuật | Development only | Local/Codex |

## Skills

| Skill | File | Purpose |
|---|---|---|
| Finance Report Analysis Agent Skill | `.agents/skills/finance-report-analysis-agent/SKILL.md` | Chuẩn hóa AI Finance Agent, missing data, JSON output |
| Finance Cashbook Analysis Skill | `.agents/skills/finance-cashbook-analysis-skill/SKILL.md` | Chuẩn hóa phân tích Sổ quỹ, dòng tiền, top thu/chi |
| Import Validation Skill | `.agents/skills/import-validation-skill/SKILL.md` | Chuẩn hóa phân tích import preview/confirm và lỗi dữ liệu |
| Finance Report Engine Skill | `.agents/skills/finance-report-engine-skill/SKILL.md` | Chuẩn hóa report engine, data source evidence, no-mock rules |
| Forecast Budget Skill | `.agents/skills/forecast-budget-skill/SKILL.md` | Chuẩn hóa Agent Dự toán: code tính số, AI giải thích |
| Production QA Finance App Skill | `.agents/skills/production-qa-finance-app-skill/SKILL.md` | Chuẩn hóa QA/build/secret/audit trước khi release |

## Routing Rule

Runtime không gửi toàn bộ Google Sheet cho AI. Code/report engine phải lọc, tính KPI, top-N, bất thường và missingSources trước; Agent chỉ nhận JSON ngắn đã kiểm chứng.

| Request intent | Agent |
|---|---|
| Tổng quan CEO, tuần tốt/xấu, rủi ro tổng hợp | AI Finance Agent |
| Sổ quỹ, tiền vào/ra, chi lớn, dòng tiền | AI Cashbook Agent |
| Import file, lỗi/trùng/lệch, có nên confirm không | AI Import Validation Agent |
| Dự toán tuần tới, 3 kịch bản | AI Forecast Agent |
| Việc kế toán cần làm hôm nay | AI Accountant Workbench Agent |

## Rule

Runtime AI analysis must load a mapped `.agents/*.md` file. If the file cannot be read, use a safe fallback that still enforces no fabricated data and missing-data rules.
