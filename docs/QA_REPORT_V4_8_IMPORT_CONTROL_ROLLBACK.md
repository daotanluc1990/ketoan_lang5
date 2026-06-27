# QA Report — V4.8 Import Control & Rollback

## Scope

V4.8 focuses on import control and rollback safety:

- Log import errors, duplicates, and mismatches into control tabs.
- Support partial import status.
- Add parsers for debt and purchasing source files.
- Add real soft rollback by import ID, using `Trạng thái dữ liệu = Đã hoàn tác`.
- Add synthetic local-data QA for all 7 source sheets and report tabs.

## Data safety

No production Google Sheet synthetic data was written during QA.

Synthetic QA uses local `.data` fixtures only, then clears the fixtures after checking:

- `DL_SO_QUY`
- `DL_DOANH_THU_CUA_HANG`
- `DL_DOANH_THU_APP`
- `DL_TON_KHO`
- `DL_THAT_THOAT_NVL`
- `DL_CONG_NO`
- `DL_THU_MUA`

## Commands run

| Command | Result |
|---|---|
| `npm run typecheck` | PASS |
| `npm run test` | PASS — 7 files, 17 tests |
| `npm run lint` | PASS |
| `npm run synthetic-data-qa` | PASS |
| `npm run agent-check` | PASS |
| `npm run static-ui-qa` | PASS |
| `npm run kiem-tra-schema` | PASS — 21 sheets |
| `npm run smoke` | PASS |
| `NEXT_TELEMETRY_DISABLED=1 npm run vercel-build` | PASS |

## Build note

Turbopack/NFT still shows one warning because the AI Agent reads `.agents/AI_FINANCE_AGENT.md` from the filesystem. This warning does not fail the build.

## Remaining risks

- Real rollback against Google Sheets should first be tested on staging/copy sheet before production.
- Full server-side RBAC remains for V4.9.
- Production data rollback does not delete rows; it soft-marks rows as `Đã hoàn tác`.
