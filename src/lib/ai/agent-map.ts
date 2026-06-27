export type FinanceAgentId =
  | 'finance'
  | 'import_validation'
  | 'cashbook'
  | 'forecast'
  | 'accountant_workbench';

export type FinanceAgentRuntimeStatus = 'active' | 'mapped' | 'future';

export type FinanceAgentDefinition = {
  id: FinanceAgentId;
  name: string;
  file: string;
  skill: string;
  purpose: string;
  runtimeStatus: FinanceAgentRuntimeStatus;
  primaryApi: string;
  readSources: string[];
  writePermission: 'none';
  mustNotDo: string[];
};

export const FINANCE_AGENT_MAP: Record<FinanceAgentId, FinanceAgentDefinition> = {
  finance: {
    id: 'finance',
    name: 'AI Finance Agent',
    file: '.agents/AI_FINANCE_AGENT.md',
    skill: '.agents/skills/finance-report-analysis-agent/SKILL.md',
    purpose:
      'Phân tích tổng hợp cho CEO: tình hình tuần, dữ liệu thiếu, rủi ro và hành động.',
    runtimeStatus: 'active',
    primaryApi: '/api/ai/report-analysis',
    readSources: ['report-engine-json', 'missingSources', 'executiveKpis'],
    writePermission: 'none',
    mustNotDo: ['Không bịa số', 'Không tự ghi Google Sheet', 'Không chốt dự toán'],
  },
  import_validation: {
    id: 'import_validation',
    name: 'AI Import Validation Agent',
    file: '.agents/AI_IMPORT_VALIDATION_AGENT.md',
    skill: '.agents/skills/import-validation-skill/SKILL.md',
    purpose:
      'Giải thích preview/confirm import, lỗi, trùng, lệch và khuyến nghị có nên confirm.',
    runtimeStatus: 'mapped',
    primaryApi: '/api/import/preview',
    readSources: ['importPreview', 'IMPORT_DONG_LOI', 'IMPORT_DU_LIEU_TRUNG', 'IMPORT_DU_LIEU_LECH'],
    writePermission: 'none',
    mustNotDo: ['Không tự confirm', 'Không tự sửa dữ liệu', 'Không bỏ qua lỗi nghiêm trọng'],
  },
  cashbook: {
    id: 'cashbook',
    name: 'AI Cashbook Agent',
    file: '.agents/AI_CASHBOOK_AGENT.md',
    skill: '.agents/skills/finance-cashbook-analysis-skill/SKILL.md',
    purpose:
      'Phân tích DL_SO_QUY: tiền vào, tiền ra, dòng tiền, top thu/chi và chi bất thường.',
    runtimeStatus: 'mapped',
    primaryApi: '/api/reports/dong-tien',
    readSources: ['DL_SO_QUY', 'cashbookSummary', 'cashbookWarningRows'],
    writePermission: 'none',
    mustNotDo: ['Không chốt P&L từ Sổ quỹ', 'Không gọi doanh thu sổ quỹ là doanh thu cuối cùng'],
  },
  forecast: {
    id: 'forecast',
    name: 'AI Forecast Agent',
    file: '.agents/AI_FORECAST_AGENT.md',
    skill: '.agents/skills/forecast-budget-skill/SKILL.md',
    purpose:
      'Giải thích dự toán tuần tới do calculation engine tạo; từ chối nếu thiếu lịch sử.',
    runtimeStatus: 'active',
    primaryApi: '/api/ai/forecast-analysis',
    readSources: ['forecastCalculation', 'historyWeeks', 'scenarios', 'dataQuality'],
    writePermission: 'none',
    mustNotDo: ['Không tự tạo số dự toán', 'Không tự ghi bản chốt', 'Không bỏ qua CEO duyệt'],
  },
  accountant_workbench: {
    id: 'accountant_workbench',
    name: 'AI Accountant Workbench Agent',
    file: '.agents/AI_ACCOUNTANT_WORKBENCH_AGENT.md',
    skill: '.agents/skills/production-qa-finance-app-skill/SKILL.md',
    purpose:
      'Tạo checklist việc kế toán từ missingSources, lỗi import, chi bất thường và việc cần CEO duyệt.',
    runtimeStatus: 'mapped',
    primaryApi: '/api/reports/import-status',
    readSources: ['missingSources', 'importIssues', 'cashbookWarnings', 'pendingApprovals'],
    writePermission: 'none',
    mustNotDo: ['Không tạo việc không có bằng chứng', 'Không tự duyệt rollback', 'Không tự sửa dữ liệu'],
  },
};

export type FinanceAgentIntent =
  | 'ceo_summary'
  | 'cashbook'
  | 'import'
  | 'forecast'
  | 'accountant_workbench'
  | 'unknown';

export function selectFinanceAgent(intent: FinanceAgentIntent): FinanceAgentDefinition {
  switch (intent) {
    case 'cashbook':
      return FINANCE_AGENT_MAP.cashbook;
    case 'import':
      return FINANCE_AGENT_MAP.import_validation;
    case 'forecast':
      return FINANCE_AGENT_MAP.forecast;
    case 'accountant_workbench':
      return FINANCE_AGENT_MAP.accountant_workbench;
    case 'ceo_summary':
    case 'unknown':
    default:
      return FINANCE_AGENT_MAP.finance;
  }
}

export function inferFinanceAgentIntent(input: string): FinanceAgentIntent {
  const text = input.toLowerCase();
  if (/(sổ quỹ|so quy|dòng tiền|dong tien|tiền vào|tien vao|tiền ra|tien ra|chi lớn|chi lon)/.test(text)) {
    return 'cashbook';
  }
  if (/(import|nhập liệu|nhap lieu|preview|confirm|trùng|trung|lệch|lech|lỗi dòng|loi dong)/.test(text)) {
    return 'import';
  }
  if (/(dự toán|du toan|forecast|budget|kịch bản|kich ban|tuần tới|tuan toi)/.test(text)) {
    return 'forecast';
  }
  if (/(bàn làm việc|ban lam viec|checklist|việc kế toán|viec ke toan|cần xử lý|can xu ly)/.test(text)) {
    return 'accountant_workbench';
  }
  if (/(ceo|tổng quan|tong quan|tuần này tốt hay xấu|tuan nay tot hay xau|phân tích tuần|phan tich tuan)/.test(text)) {
    return 'ceo_summary';
  }
  return 'unknown';
}

export function getFinanceAgentList() {
  return Object.values(FINANCE_AGENT_MAP).map((agent) => ({
    id: agent.id,
    name: agent.name,
    file: agent.file,
    skill: agent.skill,
    purpose: agent.purpose,
    runtimeStatus: agent.runtimeStatus,
    primaryApi: agent.primaryApi,
    readSources: agent.readSources,
    writePermission: agent.writePermission,
  }));
}
