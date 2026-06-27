---
name: finance-report-analysis-agent
description: Use this skill when building, reviewing, or running the AI Finance Agent that analyzes Cơm Tấm Làng weekly CEO accounting reports from Google Sheets/imported Excel data.
version: 1.0.0
category: finance
tags:
  - fnb
  - finance
  - ceo-dashboard
  - google-sheets
  - ai-agent
  - import
---

# Finance Report Analysis Agent Skill

## Purpose

Ensure every AI analysis for the Cơm Tấm Làng accounting dashboard follows the same safe, production-grade rules: real data only, no invented numbers, missing-data handling, clear CEO actions, and JSON output suitable for the web app and Telegram.

## When to Use

Use this skill when:

- Creating or modifying the AI finance agent.
- Reviewing `/api/ai/report-analysis`.
- Changing financial dashboard/P&L/cashflow/loss analysis logic.
- Connecting Google Sheet data to AI analysis.
- Testing AI output for missing data, warnings, or owner decisions.
- Preparing reports for CEO or Telegram.

Do not use this skill for unrelated UI-only changes unless the UI displays AI financial analysis.

## Inputs

Expected inputs:

- Normalized JSON from report aggregator.
- Google Sheet import status.
- P&L data.
- Cashflow data.
- Loss/waste data.
- Inventory and receivable/payable summaries when available.
- User role if available.

## Procedure

1. Confirm data mode: Google Sheets, local JSON, or mock.
2. Confirm real data exists through `hasRealData` or source counts.
3. If real data is missing, return `Chưa đủ dữ liệu để kết luận.`
4. If import errors or variances exist, prioritize data-quality warnings.
5. Analyze KPI status: good, warning, danger.
6. Identify the highest money-impact issue.
7. Explain evidence using only input data.
8. Describe likely causes as hypotheses, not facts.
9. Recommend actions with owner and deadline.
10. Return JSON only when called by API.

## Mandatory Rules

- Never invent numbers.
- Never use demo/mock data in production analysis.
- Never expose secrets.
- Never conclude fraud without evidence.
- Never hide missing data.
- Always report data limitation.
- Always include owner and deadline for actions.
- Always keep output parseable by the app.

## Output Format

Preferred API JSON:

```json
{
  "overall_status": "tot|canh_bao|nguy_hiem|chua_du_du_lieu|can_doi_chieu",
  "conclusion": "...",
  "summary_for_ceo": "...",
  "rows": [
    {
      "mucDo": "...",
      "vanDe": "...",
      "bangChung": "...",
      "nguyenNhanKhaNghi": "...",
      "viecCanLam": "...",
      "owner": "...",
      "deadline": "..."
    }
  ],
  "missing_data": [],
  "data_quality_notes": [],
  "confidence": 0.0
}
```

## Quality Criteria

A good analysis:

- tells CEO good/bad within 10 seconds;
- shows the biggest issue first;
- cites data evidence;
- distinguishes confirmed fact from likely cause;
- gives next action;
- states missing data clearly.

## Verification

Run these checks:

- Google Sheet empty → no fake revenue shown.
- Missing data → response says `Chưa đủ dữ liệu để kết luận.`
- Import error/lệch → response prioritizes data quality.
- Valid report → JSON parses.
- No secrets appear in output.
- Build and tests pass.

## Edge Cases

- OpenAI key missing: return rule-based fallback and say so.
- OpenAI returns invalid JSON: fallback safely.
- Report data too large: truncate input safely but preserve summary data.
- Contradictory data: mark `Cần đối chiếu`.
- Role restricted: do not expose profit details.

## Examples

### Missing real data

Input: `hasRealData=false`

Output conclusion: `Chưa đủ dữ liệu để kết luận.`

### Warning KPI

Input: `Tiền app chưa về > threshold`

Output: warning row with evidence, likely cause, owner `Kế toán`, deadline `24h`.

## Definition of Done

- Skill file exists under `.agents/skills/finance-report-analysis-agent/SKILL.md`.
- Runtime agent file exists under `.agents/AI_FINANCE_AGENT.md`.
- AI API loads the runtime agent file or safe fallback.
- Tests pass.
- No secret included.

## Changelog

### 1.0.0

Initial production finance report AI skill for Cơm Tấm Làng.
