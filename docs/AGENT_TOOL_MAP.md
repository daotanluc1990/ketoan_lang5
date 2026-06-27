# AGENT_TOOL_MAP — Agent to Tool/Data Mapping

| Agent | Reads | Writes | Tool/API | Notes |
|---|---|---|---|---|
| AI Finance Agent | Report JSON từ report engine | Không ghi | `/api/ai/report-analysis` | Active runtime |
| AI Import Validation Agent | Import preview/confirm JSON | Không ghi | `/api/import/preview`, `/api/import/confirm` | Mapped for V4.8.1 |
| AI Cashbook Agent | Cashbook summary JSON từ `DL_SO_QUY` | Không ghi | `/api/reports/dashboard`, `/api/reports/dong-tien` | Mapped for V4.8.1 |
| AI Forecast Agent | Forecast calculation JSON | Không ghi | future `/api/forecast/*` | Code tính số trước |
| AI Accountant Workbench Agent | Warnings/tasks JSON | Không ghi | future `/api/workbench/*` | Tạo checklist, không duyệt |

## Data Sources

| Source Sheet | Used By |
|---|---|
| `DL_SO_QUY` | Cashbook, CEO Finance, Accountant Workbench, một phần P&L/Cân đối đối chiếu |
| `DL_DOANH_THU_APP` | CEO Finance, P&L, Forecast |
| `DL_DOANH_THU_CUA_HANG` | CEO Finance, P&L, Forecast |
| `DL_TON_KHO` | Cân đối, P&L/COGS hỗ trợ, Forecast |
| `DL_THAT_THOAT_NVL` | Thất thoát, CEO Finance, Accountant Workbench |
| `DL_CONG_NO` | Cân đối, Cashbook đối chiếu trả NCC |
| `DL_THU_MUA` | Thu mua, COGS/tồn kho đối chiếu, Forecast |
| `IMPORT_*` | Import Validation, Accountant Workbench |
| `AUDIT_LOG` | CEO/Admin review |

## Runtime Safety

All write operations stay in deterministic API handlers. Agents are read-only explanation layers.


## V5.0 Forecast Tool Map

| Tool/API | Purpose | Write permission |
|---|---|---:|
| `/api/reports/du-toan` | Trả forecast calculation JSON | No |
| `/api/ai/forecast-analysis` | Forecast Agent giải thích kịch bản | No |
| `src/lib/forecast/forecast-engine.ts` | Calculation engine | No direct sheet write |
