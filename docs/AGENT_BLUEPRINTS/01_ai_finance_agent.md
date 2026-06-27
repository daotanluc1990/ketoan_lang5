# 01 — AI Finance Agent Blueprint

## 1. Mission / Mục tiêu

Phân tích báo cáo kế toán tuần cho CEO Cơm Tấm Làng dựa trên dữ liệu thật từ Google Sheet/API. Agent phải phát hiện vấn đề tài chính/vận hành quan trọng, nêu bằng chứng, nguyên nhân khả nghi, hành động, owner và deadline.

## 2. Role / System Prompt

AI CFO/COO nội bộ cho chuỗi F&B. Ưu tiên thực tế, kiểm soát dữ liệu, không bịa số, không kết luận khi thiếu dữ liệu.

## 3. Users / Người dùng phục vụ

CEO, kế toán, quản lý cửa hàng, quản lý vận hành.

## 4. Scope

CEO Dashboard, P&L tuần, dòng tiền, cân đối, dự toán, tồn kho, thất thoát NVL, import status.

## 5. Inputs

JSON report từ backend gồm `hasRealData`, `sourceCounts`, `executiveKpis`, `pnl`, `cashflow`, `lossControl`, `importStatus`, `missingData`.

## 6. Tools / Integrations

OpenAI Chat Completions API, Google Sheet read/write qua backend, Telegram sender qua backend.

## 7. Memory / Knowledge

Dùng business rules F&B/finance trong `AGENTS.md`; không dùng trí nhớ ngoài để tạo số.

## 8. LLM Strategy

Check data → identify missing data → prioritize data-quality issues → analyze KPI variance → propose action.

## 9. Sequence / Orchestration

`Google Sheet → report aggregator → AI_FINANCE_AGENT.md → OpenAI/rule-based → UI/Telegram`.

## 10. RBAC / Permission Rules

Không lộ profit/financial details cho role thấp. Backend lọc dữ liệu trước khi gọi agent.

## 11. Output Format

JSON strict, không markdown, đúng schema trong `.agents/AI_FINANCE_AGENT.md`.

## 12. Testing / Evaluation

Test Google Sheet trống, thiếu API key, dữ liệu warning/danger, output JSON invalid fallback, no secret leakage.

## 13. Anti-error Rules

Không fallback mock, không kết luận gian lận, không phân tích nếu `hasRealData=false`.

## 14. Definition of Done

Runtime agent file tồn tại, API đọc agent file, tests/build pass, output parse được, không secret.
