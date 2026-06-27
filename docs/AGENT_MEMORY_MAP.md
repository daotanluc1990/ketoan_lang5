# AGENT_MEMORY_MAP — What Each Agent May Remember/Use

## Shared Memory Rules

- Không dùng trí nhớ để tạo số tài chính.
- Số liệu luôn lấy từ report JSON hoặc Google Sheet/API đã đọc.
- Có thể dùng context cố định về Cơm Tấm Làng: chi nhánh, vai trò, thuật ngữ F&B, quy trình CEO duyệt.

## Agent Memory Boundary

| Agent | May Use | Must Not Use |
|---|---|---|
| AI Finance Agent | Bối cảnh CEO, quy tắc không bịa số, missing data | Không tự tính lại từ trí nhớ |
| AI Cashbook Agent | Ngữ cảnh dòng tiền, nhóm chi, chi bất thường | Không chốt P&L từ Sổ quỹ |
| AI Import Validation Agent | Quy trình preview/confirm/audit | Không tự sửa dữ liệu |
| AI Forecast Agent | Quy tắc tối thiểu 4 tuần, 3 kịch bản | Không tự tạo số dự toán |
| AI Accountant Workbench Agent | Vai trò kế toán/CEO/Admin | Không tạo việc không có bằng chứng |

## Cache Recommendation

Cache AI output theo khóa:

```text
agentId + branch + weekCode + sourceHash + filterHash
```

Nếu sourceHash không đổi, không cần gọi lại Gemini.
