import { readFile } from "node:fs/promises";
import path from "node:path";
import { buildDashboardReport } from "@/lib/reports/report-aggregator";
import type { ReportFilters } from "@/lib/reports/report-filters";
import { getConfiguredAiProvider, getServerEnv } from "@/lib/env/server-env";

export type AiProvider = "openai" | "gemini" | "missing";

export type AiAgentAnalysis = {
  mode: "real_openai" | "real_gemini" | "rule_based_missing_env";
  provider: AiProvider;
  agentSource: "file" | "fallback";
  overall_status?:
    | "tot"
    | "canh_bao"
    | "nguy_hiem"
    | "chua_du_du_lieu"
    | "can_doi_chieu";
  conclusion: string;
  summary_for_ceo?: string;
  rows: Array<{
    mucDo: string;
    vanDe: string;
    bangChung: string;
    nguyenNhanKhaNghi: string;
    viecCanLam: string;
    owner: string;
    deadline: string;
  }>;
  missing_data?: string[];
  data_quality_notes?: string[];
  confidence?: number;
  raw?: string;
};

const FALLBACK_AGENT_INSTRUCTIONS = `# AI_FINANCE_AGENT — Safe fallback

Bạn là AI CFO/COO nội bộ cho Cơm Tấm Làng.

Quy tắc bắt buộc:
- Không bịa số.
- Chỉ dùng dữ liệu JSON được cung cấp.
- Nếu thiếu dữ liệu, ghi chính xác: Chưa đủ dữ liệu để kết luận.
- Không dùng dữ liệu mẫu làm dữ liệu thật.
- Không kết luận gian lận nếu chưa có bằng chứng.
- Trả về JSON thuần, không markdown.
`;

const AI_ANALYSIS_JSON_SCHEMA = {
  type: "object",
  properties: {
    overall_status: {
      type: "string",
      enum: [
        "tot",
        "canh_bao",
        "nguy_hiem",
        "chua_du_du_lieu",
        "can_doi_chieu",
      ],
    },
    conclusion: { type: "string" },
    summary_for_ceo: { type: "string" },
    rows: {
      type: "array",
      items: {
        type: "object",
        properties: {
          mucDo: { type: "string" },
          vanDe: { type: "string" },
          bangChung: { type: "string" },
          nguyenNhanKhaNghi: { type: "string" },
          viecCanLam: { type: "string" },
          owner: { type: "string" },
          deadline: { type: "string" },
        },
        required: [
          "mucDo",
          "vanDe",
          "bangChung",
          "nguyenNhanKhaNghi",
          "viecCanLam",
          "owner",
          "deadline",
        ],
      },
    },
    missing_data: { type: "array", items: { type: "string" } },
    data_quality_notes: { type: "array", items: { type: "string" } },
    confidence: { type: "number" },
  },
  required: [
    "overall_status",
    "conclusion",
    "summary_for_ceo",
    "rows",
    "missing_data",
    "data_quality_notes",
    "confidence",
  ],
} as const;

let cachedAgentInstructions: string | null = null;
let cachedAgentSource: "file" | "fallback" | null = null;

export async function loadAiFinanceAgentInstructions(): Promise<{
  content: string;
  source: "file" | "fallback";
}> {
  if (cachedAgentInstructions && cachedAgentSource) {
    return { content: cachedAgentInstructions, source: cachedAgentSource };
  }

  const candidates = [
    path.join(
      /*turbopackIgnore: true*/ process.cwd(),
      ".agents",
      "AI_FINANCE_AGENT.md",
    ),
    path.join(
      /*turbopackIgnore: true*/ process.cwd(),
      "src",
      "ai",
      "AI_FINANCE_AGENT.md",
    ),
  ];

  for (const candidate of candidates) {
    try {
      const content = await readFile(candidate, "utf8");
      if (
        content.includes("AI_FINANCE_AGENT") &&
        content.includes("Chưa đủ dữ liệu để kết luận")
      ) {
        cachedAgentInstructions = content;
        cachedAgentSource = "file";
        return { content, source: "file" };
      }
    } catch {
      // Continue to fallback without exposing filesystem details to the user.
    }
  }

  cachedAgentInstructions = FALLBACK_AGENT_INSTRUCTIONS;
  cachedAgentSource = "fallback";
  return { content: FALLBACK_AGENT_INSTRUCTIONS, source: "fallback" };
}

function normalizeRuleBasedResult(
  result: Omit<AiAgentAnalysis, "agentSource" | "provider">,
  agentSource: "file" | "fallback",
  provider: AiProvider,
): AiAgentAnalysis {
  return {
    agentSource,
    provider,
    overall_status:
      result.overall_status ??
      (result.rows.some((row) => row.mucDo === "Nguy hiểm")
        ? "nguy_hiem"
        : result.rows.some((row) => row.mucDo === "Cảnh báo")
          ? "canh_bao"
          : "tot"),
    summary_for_ceo: result.summary_for_ceo ?? result.conclusion,
    missing_data: result.missing_data ?? [],
    data_quality_notes: result.data_quality_notes ?? [],
    confidence: result.confidence ?? 0.5,
    ...result,
  };
}

function ruleBasedAnalysis(
  report: Awaited<ReturnType<typeof buildDashboardReport>>,
  agentSource: "file" | "fallback",
  provider: AiProvider = "missing",
): AiAgentAnalysis {
  if ("hasRealData" in report && !report.hasRealData) {
    return normalizeRuleBasedResult(
      {
        mode: "rule_based_missing_env",
        overall_status: "chua_du_du_lieu",
        conclusion:
          "Chưa đủ dữ liệu để kết luận. Google Sheet/data store chưa có dữ liệu import thật.",
        summary_for_ceo:
          "Chưa đủ dữ liệu để kết luận. Cần import file và xác nhận ghi vào Google Sheet trước khi xem phân tích AI.",
        rows: [
          {
            mucDo: "Chưa đủ dữ liệu",
            vanDe: "Chưa có dữ liệu thật",
            bangChung: report.message,
            nguyenNhanKhaNghi:
              "Chưa import hoặc chưa xác nhận ghi Google Sheet.",
            viecCanLam:
              "Import đủ file và kiểm tra các sheet DL_* có dữ liệu từ dòng 4.",
            owner: "Kế toán",
            deadline: "Hôm nay",
          },
        ],
        missing_data: ["Dữ liệu import thật trong Google Sheet"],
        data_quality_notes: [
          "AI Agent không phân tích sâu khi nguồn dữ liệu thật chưa có.",
        ],
        confidence: 0,
      },
      agentSource,
      provider,
    );
  }
  const kpis = "executiveKpis" in report ? report.executiveKpis : [];
  const cashbookWarningRows =
    "cashbookWarningRows" in report ? report.cashbookWarningRows : [];
  if (cashbookWarningRows.length) {
    return normalizeRuleBasedResult(
      {
        mode: "rule_based_missing_env",
        overall_status: "canh_bao",
        conclusion:
          "Chưa có AI API key phù hợp nên dùng rule-based. Có khoản chi lớn trong Sổ quỹ cần kiểm tra.",
        rows: cashbookWarningRows.slice(0, 5).map((row) => ({
          mucDo: "Cảnh báo",
          vanDe: `Chi lớn từ sổ quỹ: ${row[3] ?? ""}`,
          bangChung: `${row[1] ?? ""} — ${row[4] ?? ""}`,
          nguyenNhanKhaNghi: String(
            row[5] ?? "Khoản chi lớn hơn ngưỡng cảnh báo.",
          ),
          viecCanLam: String(
            row[6] ?? "Kế toán đối chiếu chứng từ và giải trình.",
          ),
          owner: "Kế toán",
          deadline: "24h",
        })),
        missing_data: report.missingSources ?? [],
        data_quality_notes: [
          "Đã có dữ liệu Sổ quỹ nên có thể phân tích dòng tiền; chưa được chốt P&L nếu thiếu nguồn còn lại.",
        ],
        confidence: 0.55,
      },
      agentSource,
      provider,
    );
  }
  const warningKpis = kpis.filter(
    (kpi) => kpi.status === "warning" || kpi.status === "danger",
  );
  if (!warningKpis.length) {
    return normalizeRuleBasedResult(
      {
        mode: "rule_based_missing_env",
        overall_status: "tot",
        conclusion:
          "Chưa có AI API key phù hợp nên dùng rule-based. Dữ liệu hiện tại chưa có cảnh báo warning/danger lớn.",
        rows: [
          {
            mucDo: "Tốt",
            vanDe: "Chưa phát hiện cảnh báo lớn",
            bangChung: "Không có KPI warning/danger",
            nguyenNhanKhaNghi: "Chưa đủ dữ liệu để kết luận nguyên nhân sâu.",
            viecCanLam: "Tiếp tục cập nhật dữ liệu thật.",
            owner: "Kế toán",
            deadline: "Hôm nay",
          },
        ],
        data_quality_notes: [
          "Rule-based fallback đang chạy vì thiếu cấu hình AI_PROVIDER/GEMINI_API_KEY hoặc OPENAI_API_KEY.",
        ],
        confidence: 0.4,
      },
      agentSource,
      provider,
    );
  }
  return normalizeRuleBasedResult(
    {
      mode: "rule_based_missing_env",
      overall_status: warningKpis.some((kpi) => kpi.status === "danger")
        ? "nguy_hiem"
        : "canh_bao",
      conclusion:
        "Chưa có AI API key phù hợp nên dùng phân tích rule-based. Không gọi AI thật.",
      rows: warningKpis.slice(0, 5).map((kpi) => ({
        mucDo: kpi.status === "danger" ? "Nguy hiểm" : "Cảnh báo",
        vanDe: kpi.label,
        bangChung: `${kpi.value} — ${kpi.trend}`,
        nguyenNhanKhaNghi:
          "Chưa đủ dữ liệu để kết luận nguyên nhân chắc chắn. Cần đối soát file nguồn.",
        viecCanLam: `Kiểm tra lại chỉ số ${kpi.label} trong báo cáo tuần và file import liên quan.`,
        owner: kpi.label.toLowerCase().includes("thất thoát")
          ? "Kế toán + Quản lý cửa hàng"
          : "Kế toán",
        deadline: "24h",
      })),
      data_quality_notes: [
        "Rule-based fallback đang chạy vì thiếu cấu hình AI_PROVIDER/GEMINI_API_KEY hoặc OPENAI_API_KEY.",
      ],
      confidence: 0.45,
    },
    agentSource,
    provider,
  );
}

function safeJsonFromText(
  text: string,
): Omit<AiAgentAnalysis, "mode" | "raw" | "agentSource" | "provider"> | null {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    const parsed = JSON.parse(match[0]) as Omit<
      AiAgentAnalysis,
      "mode" | "raw" | "agentSource" | "provider"
    >;
    if (Array.isArray(parsed.rows) && typeof parsed.conclusion === "string")
      return parsed;
    return null;
  } catch {
    return null;
  }
}

async function callOpenAi(agentContent: string, userPrompt: string) {
  const env = getServerEnv();
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${env.openAiApiKey}`,
    },
    body: JSON.stringify({
      model: env.openAiModel,
      messages: [
        { role: "system", content: agentContent },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.2,
      response_format: { type: "json_object" },
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`OpenAI API lỗi: ${text.slice(0, 200)}`);
  }
  const json = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  return json.choices?.[0]?.message?.content ?? "";
}

async function callGemini(agentContent: string, userPrompt: string) {
  const env = getServerEnv();
  const response = await fetch(
    "https://generativelanguage.googleapis.com/v1beta/interactions",
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-goog-api-key": env.geminiApiKey ?? "",
      },
      body: JSON.stringify({
        model: env.geminiModel,
        system_instruction: agentContent,
        input: userPrompt,
        generation_config: {
          temperature: 0.2,
          thinking_level: "low",
        },
        response_format: {
          type: "text",
          mime_type: "application/json",
          schema: AI_ANALYSIS_JSON_SCHEMA,
        },
      }),
    },
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Gemini API lỗi: ${text.slice(0, 200)}`);
  }
  const json = (await response.json()) as {
    output_text?: string;
    steps?: Array<{ output_text?: string; text?: string }>;
  };
  return (
    json.output_text ??
    json.steps?.map((step) => step.output_text ?? step.text ?? "").join("\n") ??
    ""
  );
}

export async function analyzeReportWithAi(
  filters: ReportFilters = {},
): Promise<AiAgentAnalysis> {
  const report = await buildDashboardReport(filters);
  const agent = await loadAiFinanceAgentInstructions();
  const provider = getConfiguredAiProvider();

  if (provider === "missing")
    return ruleBasedAnalysis(report, agent.source, provider);

  if ("hasRealData" in report && !report.hasRealData) {
    return ruleBasedAnalysis(report, agent.source, provider);
  }

  const userPrompt = `Dữ liệu báo cáo JSON:\n${JSON.stringify(report).slice(0, 24000)}\n\nHãy phân tích theo đúng file AI_FINANCE_AGENT.md. Trả JSON thuần, không markdown.`;

  try {
    const content =
      provider === "gemini"
        ? await callGemini(agent.content, userPrompt)
        : await callOpenAi(agent.content, userPrompt);

    const parsed = safeJsonFromText(content);
    if (!parsed)
      return {
        ...ruleBasedAnalysis(report, agent.source, provider),
        conclusion: "AI trả về format không hợp lệ, dùng rule-based fallback.",
        raw: content.slice(0, 500),
      };
    return {
      mode: provider === "gemini" ? "real_gemini" : "real_openai",
      provider,
      agentSource: agent.source,
      overall_status: parsed.overall_status ?? "canh_bao",
      summary_for_ceo: parsed.summary_for_ceo ?? parsed.conclusion,
      missing_data: parsed.missing_data ?? [],
      data_quality_notes: parsed.data_quality_notes ?? [],
      confidence: parsed.confidence ?? 0.7,
      ...parsed,
      raw: content.slice(0, 500),
    };
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "AI provider lỗi không xác định.";
    return {
      ...ruleBasedAnalysis(report, agent.source, provider),
      conclusion: `${provider === "gemini" ? "Gemini" : "OpenAI"} API lỗi, dùng rule-based fallback. ${message}`,
    };
  }
}
