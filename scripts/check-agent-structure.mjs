import { readFileSync, existsSync } from "node:fs";

const requiredFiles = [
  "AGENTS.md",
  "docs/SKILL_AGENT_STRUCTURE_GUIDE.md",
  "docs/AGENT_MAP.md",
  "docs/AGENT_SEQUENCE.md",
  "docs/AGENT_TOOL_MAP.md",
  "docs/AGENT_MEMORY_MAP.md",
  "docs/AGENT_EVALUATION.md",
  "docs/AGENT_BLUEPRINTS/01_ai_finance_agent.md",
  "docs/AGENT_BLUEPRINTS/02_ai_import_validation_agent.md",
  "docs/AGENT_BLUEPRINTS/03_ai_cashbook_agent.md",
  "docs/AGENT_BLUEPRINTS/04_ai_forecast_agent.md",
  "docs/AGENT_BLUEPRINTS/05_ai_accountant_workbench_agent.md",
  ".agents/AI_FINANCE_AGENT.md",
  ".agents/AI_IMPORT_VALIDATION_AGENT.md",
  ".agents/AI_CASHBOOK_AGENT.md",
  ".agents/AI_FORECAST_AGENT.md",
  ".agents/AI_ACCOUNTANT_WORKBENCH_AGENT.md",
  ".agents/skills/finance-report-analysis-agent/SKILL.md",
  ".agents/skills/finance-cashbook-analysis-skill/SKILL.md",
  ".agents/skills/import-validation-skill/SKILL.md",
  ".agents/skills/finance-report-engine-skill/SKILL.md",
  ".agents/skills/forecast-budget-skill/SKILL.md",
  ".agents/skills/production-qa-finance-app-skill/SKILL.md",
];

const missing = requiredFiles.filter((file) => !existsSync(file));
if (missing.length) {
  throw new Error(`Missing agent files: ${missing.join(", ")}`);
}

const skillFiles = [
  ".agents/skills/finance-report-analysis-agent/SKILL.md",
  ".agents/skills/finance-cashbook-analysis-skill/SKILL.md",
  ".agents/skills/import-validation-skill/SKILL.md",
  ".agents/skills/finance-report-engine-skill/SKILL.md",
  ".agents/skills/forecast-budget-skill/SKILL.md",
  ".agents/skills/production-qa-finance-app-skill/SKILL.md",
];
for (const skillFile of skillFiles) {
  const skill = readFileSync(skillFile, "utf8");
  if (!skill.startsWith("---"))
    throw new Error(`${skillFile} must start with YAML front matter ---`);
  for (const token of [
    "name:",
    "description:",
    "version:",
    "Purpose",
    "When to Use",
    "Inputs",
    "Procedure",
    "Mandatory Rules",
    "Output Format",
    "Quality Criteria",
    "Verification",
    "Edge Cases",
    "Examples",
    "Definition of Done",
    "Changelog",
  ]) {
    if (!skill.includes(token))
      throw new Error(`${skillFile} missing required section/token: ${token}`);
  }
}

const runtimeAgent = readFileSync(".agents/AI_FINANCE_AGENT.md", "utf8");
for (const token of [
  "AI_FINANCE_AGENT",
  "Chưa đủ dữ liệu để kết luận",
  "Không bịa số",
  "Output Format",
  "Definition of Done",
]) {
  if (!runtimeAgent.includes(token))
    throw new Error(`Runtime agent missing required token: ${token}`);
}

const specializedAgents = [
  [".agents/AI_IMPORT_VALIDATION_AGENT.md", "AI_IMPORT_VALIDATION_AGENT"],
  [".agents/AI_CASHBOOK_AGENT.md", "AI_CASHBOOK_AGENT"],
  [".agents/AI_FORECAST_AGENT.md", "AI_FORECAST_AGENT"],
  [".agents/AI_ACCOUNTANT_WORKBENCH_AGENT.md", "AI_ACCOUNTANT_WORKBENCH_AGENT"],
];
for (const [agentFile, token] of specializedAgents) {
  const content = readFileSync(agentFile, "utf8");
  for (const requiredToken of [token, "Chưa đủ dữ liệu", "Không bịa số", "Output Format", "Definition of Done"]) {
    if (!content.includes(requiredToken))
      throw new Error(`${agentFile} missing required token: ${requiredToken}`);
  }
}

const blueprint = readFileSync(
  "docs/AGENT_BLUEPRINTS/01_ai_finance_agent.md",
  "utf8",
);
for (let i = 1; i <= 14; i += 1) {
  if (!blueprint.includes(`## ${i}.`))
    throw new Error(`Agent blueprint missing section ${i}`);
}

const aiCode = readFileSync("src/lib/ai/agent.ts", "utf8");
if (!aiCode.includes("loadAiFinanceAgentInstructions"))
  throw new Error("AI API does not expose/load runtime agent instructions");
if (!aiCode.includes("'.agents'") && !aiCode.includes('\".agents\"'))
  throw new Error("AI API does not reference .agents runtime prompt path");

console.log(
  "Agent structure QA passed: runtime agent, skill, blueprint, maps, and AI API linkage are present.",
);
