import { describe, expect, it } from 'vitest';
import { FINANCE_AGENT_MAP, getFinanceAgentList, inferFinanceAgentIntent, selectFinanceAgent } from '../agent-map';

describe('Finance Agent Map', () => {
  it('contains all specialized finance agents', () => {
    expect(Object.keys(FINANCE_AGENT_MAP).sort()).toEqual([
      'accountant_workbench',
      'cashbook',
      'finance',
      'forecast',
      'import_validation',
    ]);
    expect(getFinanceAgentList()).toHaveLength(5);
  });

  it('keeps all agents read-only', () => {
    for (const agent of getFinanceAgentList()) {
      expect(agent.writePermission).toBe('none');
      expect(agent.file).toContain('.agents/');
      expect(agent.skill).toContain('.agents/skills/');
    }
  });

  it('routes common Vietnamese intents to the right agent', () => {
    expect(selectFinanceAgent(inferFinanceAgentIntent('phân tích sổ quỹ tuần này')).id).toBe('cashbook');
    expect(selectFinanceAgent(inferFinanceAgentIntent('kiểm tra import bị trùng dòng')).id).toBe('import_validation');
    expect(selectFinanceAgent(inferFinanceAgentIntent('lập dự toán tuần tới')).id).toBe('forecast');
    expect(selectFinanceAgent(inferFinanceAgentIntent('bàn làm việc kế toán hôm nay')).id).toBe('accountant_workbench');
    expect(selectFinanceAgent(inferFinanceAgentIntent('CEO xem tổng quan tuần')).id).toBe('finance');
  });
});
