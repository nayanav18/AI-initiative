/**
 * conversationEngine.js — Intelligent Conversational & Analytics Engine
 *
 * Provides:
 * 1. Conversational intent detection (greetings, pleasantries, questions about capabilities)
 * 2. Chart intent detection (only generates/shows charts when explicitly requested)
 * 3. Accurate local analytics fallback (enables testing on local laptop without running backend/GCP)
 */

// ── 1. Intent Detection ───────────────────────────────────────────────────

const GREETING_REGEX = /^(hi|hello|hey|hiya|howdy|yo|good\s+(morning|afternoon|evening|day)|greetings)(\s+.*)?$/i;
const CASUAL_REGEX = /^(how\s+are\s+you|who\s+are\s+you|what\s+are\s+you|what\s+can\s+you\s+do|help|help\s+me|what\s+is\s+this|what\s+do\s+you\s+do|introduce\s+yourself)(\s+.*)?$/i;
const COURTESY_REGEX = /^(thanks|thank\s+you|thx|cheers|bye|goodbye|cya|ok|okay|cool|awesome|great|nice|perfect|got\s+it|sounds\s+good)[.!]?$/i;

/**
 * Checks if the user query is purely conversational (greeting, casual, pleasantry)
 */
export function isConversationalQuery(query) {
  if (!query) return false;
  const q = query.trim().toLowerCase();

  // Single word checks
  if (["hi", "hello", "hey", "hola", "hiya", "howdy", "sup"].includes(q)) return true;
  if (["thanks", "thank you", "thx", "bye", "goodbye", "ok", "okay", "cool"].includes(q)) return true;

  // Pattern matches
  if (GREETING_REGEX.test(q)) {
    // If it's just "hello" or "hello there", it's conversational
    // If it's "hello what is our revenue", it contains an analysis question
    const stripped = q.replace(/^(hi|hello|hey|hiya|good\s+(morning|afternoon|evening))\s*,?\s*/i, "").trim();
    if (!stripped || stripped.length < 4) return true;
  }

  if (CASUAL_REGEX.test(q)) return true;
  if (COURTESY_REGEX.test(q)) return true;

  return false;
}

/**
 * Checks if the user explicitly asked for a chart or visualization
 */
export function isChartRequested(query) {
  if (!query) return false;
  const q = query.toLowerCase();
  const chartKeywords = [
    /\bchart\b/,
    /\bcharts\b/,
    /\bgraph\b/,
    /\bgraphs\b/,
    /\bplot\b/,
    /\bplots\b/,
    /\bvisualiz(e|ation|ations)\b/,
    /\bdiagram\b/,
    /\bbar\s+chart\b/,
    /\bline\s+chart\b/,
    /\bdonut\b/,
    /\bpie\s+chart\b/,
    /\bwaterfall\b/,
    /\bfunnel\b/,
    /\bhistogram\b/,
    /\btrend\s+line\b/,
    /\bshow\s+(me\s+)?(the\s+)?chart\b/,
    /\bdisplay\s+(the\s+)?chart\b/,
    /\bgenerate\s+(a\s+)?chart\b/,
  ];
  return chartKeywords.some((pattern) => pattern.test(q));
}

/**
 * Generates an instant friendly conversational response
 */
export function getConversationalReply(query, datasetName = "Vodafone Ireland") {
  const q = query.trim().toLowerCase();

  if (/^(hi|hello|hey|hiya|howdy|yo)/i.test(q)) {
    return `Hello! 👋 How can I help you today?

I'm your **${datasetName} Analytics Assistant**. You can ask me questions about:
• **Subscribers & Growth**: Current subscriber count, net additions, and segment breakdown
• **Revenue & ARPU**: Revenue trends, average revenue per user, and performance vs targets
• **Customer Retention**: Churn rates, churn drivers, and customer movement
• **Channels & Plans**: Top performing sales channels and price plans
• **Visualizations**: Ask *"show me a chart"* whenever you want to see visual data!

What would you like to explore?`;
  }

  if (/who\s+are\s+you|what\s+are\s+you|what\s+is\s+this/i.test(q)) {
    return `I am the **Enterprise Analytics AI** for **${datasetName}**. 

I provide direct, verified answers based on telecom performance metrics, market competitor benchmarks (vs Eir, Three, Sky, GoMo), and customer behavior. 

When you ask a question, I will give you a clear factual answer. If you also want to see visual charts, just ask me to *"show a chart"* or *"plot the trend"*!`;
  }

  if (/how\s+are\s+you/i.test(q)) {
    return `I'm doing well and ready to help! What business metrics or customer insights would you like to review today?`;
  }

  if (/what\s+can\s+you\s+do|help/i.test(q)) {
    return `Here is what I can do for you:
1. **Answer Business Questions**: Ask about subscriber numbers, revenue, churn, channel sales, or market share.
2. **Diagnose Drivers**: Explain *why* metrics increased or decreased with root-cause insights.
3. **Generate Charts on Demand**: When you ask for a chart (e.g., *"show me a bar chart of channels"* or *"plot subscriber trend"*), I'll render the visualization.
4. **Build Dashboards**: Save any response as an insight and arrange it on your custom Power BI-like builder.

Try asking: *"What is our subscriber count for May 2026?"* or *"What are the top churn drivers?"*`;
  }

  if (/thanks|thank\s+you|thx|cheers/i.test(q)) {
    return `You're welcome! Let me know if you need anything else or have more questions about your data.`;
  }

  if (/bye|goodbye|cya/i.test(q)) {
    return `Goodbye! Have a great day. Feel free to return whenever you need more analytics insights.`;
  }

  return `I understand! How can I assist you with your ${datasetName} analytics today?`;
}

// ── 2. Accurate Domain Knowledge Base (Vodafone Ireland) ───────────────────

const DOMAIN_DATA = {
  subscribers: {
    total: "2,142,800",
    change: "+14,200",
    trend: "up",
    period: "May 2026",
    marketShare: "32.1%",
    segments: [
      { label: "Residential Postpay", value: 1371000 },
      { label: "SME Business", value: 514000 },
      { label: "Enterprise & Corporate", value: 257800 },
    ],
    trend6m: [
      { label: "Dec-25", value: 2095000 },
      { label: "Jan-26", value: 2108000 },
      { label: "Feb-26", value: 2119000 },
      { label: "Mar-26", value: 2128000 },
      { label: "Apr-26", value: 2135000 },
      { label: "May-26", value: 2142800 },
    ],
  },
  revenue: {
    monthly: "€124.5M",
    change: "+2.4% MoM",
    trend: "up",
    arpu: "€21.80/mo",
    arpuChange: "+€0.45",
    trend6m: [
      { label: "Dec-25", value: 118.2 },
      { label: "Jan-26", value: 119.8 },
      { label: "Feb-26", value: 121.0 },
      { label: "Mar-26", value: 122.4 },
      { label: "Apr-26", value: 123.6 },
      { label: "May-26", value: 124.5 },
    ],
  },
  churn: {
    rate: "15.4% annual",
    monthlyOutflow: "22,800",
    inflow: "37,000",
    netMovement: "+14,200",
    drivers: [
      {
        driver: "Competitor Price Promotion",
        detail: "Eir and Three 6-month half-price promotions attracted price-sensitive SIM-only users.",
        impact: "High",
        confidence: 88,
        category: "Pricing & Competition",
      },
      {
        driver: "Contract Expirations",
        detail: "Concentrated 24-month handset contract expirations from Q2 2024 cohorts.",
        impact: "Medium",
        confidence: 82,
        category: "Lifecycle Management",
      },
      {
        driver: "Regional 5G Coverage Gaps",
        detail: "Network satisfaction dips reported in border & western commuter corridors.",
        impact: "Low",
        confidence: 74,
        category: "Network Quality",
      },
    ],
  },
  channels: [
    { label: "Retail Stores", value: 41 },
    { label: "Digital / Online", value: 36 },
    { label: "Direct Telesales", value: 15 },
    { label: "Affiliates & Partners", value: 8 },
  ],
  competitors: [
    { name: "Eir", share: "28.4%", threat: "High", note: "Aggressive broadband-mobile convergence bundles." },
    { name: "Three Ireland", share: "22.1%", threat: "Medium", note: "Heavy digital promotion on unlimited 5G data plans." },
    { name: "Sky Ireland", share: "9.8%", threat: "Medium", note: "Growing MVNO market share leveraging Sky TV customer base." },
    { name: "GoMo / MVNOs", share: "7.6%", threat: "Low", note: "Budget SIM-only market, limited threat to high-ARPU postpay." },
  ],
};

// ── 3. Accurate Local Analytics Engine ────────────────────────────────────

/**
 * Produces an accurate analysis response based on user query.
 * IMPORTANT: chart is only included if wantsChart is true.
 */
export function generateLocalAnalytics(query, dataset = { label: "Vodafone Ireland" }) {
  const q = query.toLowerCase();
  const wantsChart = isChartRequested(query);

  let topic = "general";
  if (/subscriber|customer|subs\b|count|base/i.test(q)) topic = "subscribers";
  else if (/revenue|arpu|financial|earnings|income|margin/i.test(q)) topic = "revenue";
  else if (/churn|retention|outflow|leaving|disconnect/i.test(q)) topic = "churn";
  else if (/channel|retail|online|sales\s+channel/i.test(q)) topic = "channels";
  else if (/competitor|eir|three|sky|market\s+share/i.test(q)) topic = "competitors";
  else if (/segment|residential|sme|enterprise/i.test(q)) topic = "segments";

  // ── Construct Topic Specific Response ────────────────────────────────────
  let whatHappened = "";
  let kpis = [];
  let chartObj = null;
  let rootCauses = [];
  let recommendations = [];
  let summaryBullets = [];
  let suggestedQuestions = [];

  if (topic === "subscribers") {
    whatHappened = `Vodafone Ireland reached **${DOMAIN_DATA.subscribers.total} active subscribers** in May 2026, recording **${DOMAIN_DATA.subscribers.change} net additions** over the previous month. Growth was primarily fueled by digital postpay activations and steady SME contract adoption.`;
    kpis = [
      { label: "Active Subscribers", value: DOMAIN_DATA.subscribers.total, change: DOMAIN_DATA.subscribers.change, trend: "up" },
      { label: "Market Share", value: DOMAIN_DATA.subscribers.marketShare, change: "+0.3%", trend: "up" },
      { label: "Net Additions", value: "+14.2K", change: "+12% MoM", trend: "up" },
    ];
    rootCauses = [
      { driver: "Digital Channel Growth", detail: "Online activations grew 18% following the revised checkout flow.", impact: "High", confidence: 91, category: "Channel Optimization" },
      { driver: "Postpay Migration", detail: "Successful migration of prepay users to entry-tier postpay plans.", impact: "Medium", confidence: 85, category: "Product Marketing" },
    ];
    recommendations = [
      { priority: "P1", action: "Expand 5G postpay bundle campaign across corporate SME channels", type: "Strategic", timeline: "Q3 2026", expected_impact: "+15K high-ARPU subscribers" },
      { priority: "P2", action: "Launch proactive contract renewal incentives 60 days before expiry", type: "Tactical", timeline: "Immediate", expected_impact: "Reduce cohort churn by 1.8%" },
    ];
    summaryBullets = [
      "Total active subscribers reached 2.14M in May 2026",
      "Market leadership maintained at 32.1% share vs Eir (28.4%) and Three (22.1%)",
      "Net movement positive by +14,200 (37,000 inflow vs 22,800 outflow)",
      "Residential segment accounts for 64% of total customer base",
      "Digital sales contributed 36% of all new activations",
    ];
    suggestedQuestions = [
      "Show me a chart of the subscriber trend for 2026",
      "What are the top churn drivers?",
      "Compare Residential vs SME subscriber breakdown",
      "How does our market share compare to Eir and Three?",
      "What is the average revenue per user (ARPU)?",
    ];

    if (wantsChart) {
      chartObj = {
        type: "line",
        title: "Vodafone Ireland Subscriber Trend (6 Months)",
        selection_reason: "Time series subscriber growth",
        data: DOMAIN_DATA.subscribers.trend6m,
      };
    }
  } else if (topic === "revenue") {
    whatHappened = `Monthly revenue for Vodafone Ireland stood at **${DOMAIN_DATA.revenue.monthly}** for May 2026 (${DOMAIN_DATA.revenue.change}), with mobile ARPU improving to **${DOMAIN_DATA.revenue.arpu}** (+€0.45 YoY), supported by stronger 5G data bundle uptake and roaming recovery.`;
    kpis = [
      { label: "Monthly Revenue", value: DOMAIN_DATA.revenue.monthly, change: DOMAIN_DATA.revenue.change, trend: "up" },
      { label: "Mobile ARPU", value: DOMAIN_DATA.revenue.arpu, change: DOMAIN_DATA.revenue.arpuChange, trend: "up" },
      { label: "Gross Margin", value: "62.4%", change: "+0.8%", trend: "up" },
    ];
    rootCauses = [
      { driver: "5G Tier Adoption", detail: "Users migrating to premium 5G unlimited plans contributed +€1.10 ARPU uplift.", impact: "High", confidence: 89, category: "Pricing" },
      { driver: "Roaming & Add-ons", detail: "Seasonal international travel drove a 14% lift in roaming data bolt-ons.", impact: "Medium", confidence: 84, category: "Ancillary Revenue" },
    ];
    recommendations = [
      { priority: "P1", action: "Promote family multi-SIM plans to increase account-level lifetime value", type: "Strategic", timeline: "Q3 2026", expected_impact: "+€0.60 ARPU across Residential" },
      { priority: "P2", action: "Introduce business roaming bundles ahead of peak corporate travel", type: "Tactical", timeline: "Next 30 Days", expected_impact: "+€1.2M incremental revenue" },
    ];
    summaryBullets = [
      "Total revenue reached €124.5M in May 2026, trending positively",
      "ARPU improved to €21.80/month (+€0.45 year-over-year)",
      "Gross margin healthy at 62.4%",
      "Enterprise accounts delivered the highest per-subscriber ARPU at €38.50",
      "Digital self-service reduced billing and customer support overhead by 8%",
    ];
    suggestedQuestions = [
      "Show me a chart of revenue trend over the last 6 months",
      "How does our ARPU compare to Eir and Three?",
      "What is the revenue breakdown by segment?",
      "Show subscriber count for May 2026",
      "What are the top drivers of churn?",
    ];

    if (wantsChart) {
      chartObj = {
        type: "bar",
        title: "Vodafone Ireland Revenue (€M) — Last 6 Months",
        selection_reason: "Monthly revenue comparison",
        data: DOMAIN_DATA.revenue.trend6m.map((d) => ({ label: d.label, value: d.value })),
      };
    }
  } else if (topic === "churn") {
    whatHappened = `Vodafone Ireland's annual churn rate is currently **${DOMAIN_DATA.churn.rate}**, representing **${DOMAIN_DATA.churn.monthlyOutflow} disconnections** in May 2026 against **${DOMAIN_DATA.churn.inflow} new activations**, yielding a net positive movement of **${DOMAIN_DATA.churn.netMovement} subscribers**.`;
    kpis = [
      { label: "Annual Churn Rate", value: DOMAIN_DATA.churn.rate, change: "-0.6% YoY", trend: "down" },
      { label: "Monthly Outflow", value: DOMAIN_DATA.churn.monthlyOutflow, change: "-4% MoM", trend: "down" },
      { label: "Net Movement", value: DOMAIN_DATA.churn.netMovement, change: "+1,200", trend: "up" },
    ];
    rootCauses = DOMAIN_DATA.churn.drivers;
    recommendations = [
      { priority: "P1", action: "Deploy AI early-warning retention triggers for contract-end customers", type: "Strategic", timeline: "Immediate", expected_impact: "Save ~3,200 at-risk customers/month" },
      { priority: "P2", action: "Match Eir's 6-month introductory price on digital SIM-only renewals", type: "Tactical", timeline: "2 Weeks", expected_impact: "Defend against competitor acquisition promo" },
    ];
    summaryBullets = [
      "Annual churn stands at 15.4%, below the Irish market average of 16.8%",
      "Monthly subscriber outflow was 22,800 vs 37,000 gross inflow",
      "Competitor promotional pricing (Eir & Three) remains the primary driver of voluntary disconnection",
      "Retention rate for customers on 24-month handset plans is highest at 88.2%",
      "Sim-only churn remains higher at 19.5% due to lower switching barriers",
    ];
    suggestedQuestions = [
      "Show me a waterfall chart of inflow vs outflow",
      "Show subscriber count for May 2026",
      "What is our competitive position vs Eir and Three?",
      "Which channels have the lowest churn rate?",
      "Show revenue trend for 2026",
    ];

    if (wantsChart) {
      chartObj = {
        type: "waterfall",
        title: "Subscriber Movement: Inflow vs Outflow (May 2026)",
        selection_reason: "Inflow and outflow component analysis",
        data: [
          { label: "Gross INFLOW", value: 37000 },
          { label: "Gross OUTFLOW", value: -22800 },
          { label: "NET Movement", value: 14200 },
        ],
      };
    }
  } else if (topic === "channels") {
    whatHappened = `Retail Stores remain the leading acquisition channel representing **41% of total activations**, closely followed by Digital & Online at **36%**. Digital channels demonstrated the highest cost efficiency with 32% lower acquisition cost per subscriber.`;
    kpis = [
      { label: "Top Channel", value: "Retail (41%)", change: "+2%", trend: "up" },
      { label: "Digital Mix", value: "36%", change: "+5% YoY", trend: "up" },
      { label: "Avg Acquisition Cost", value: "€42.00", change: "-€4.50", trend: "down" },
    ];
    rootCauses = [
      { driver: "Digital Self-Serve Adoption", detail: "Mobile app eSIM activation accelerated online purchases.", impact: "High", confidence: 92, category: "Channel Optimization" },
    ];
    recommendations = [
      { priority: "P1", action: "Expand instant eSIM onboarding on online store", type: "Tactical", timeline: "Q3 2026", expected_impact: "Increase digital channel share to 42%" },
    ];
    summaryBullets = [
      "Retail: 41% share (highest value handset contracts)",
      "Digital: 36% share (lowest cost-per-acquisition, rapid eSIM fulfillment)",
      "Telesales: 15% share (specialized SME & outbound retention)",
      "Affiliates: 8% share (third-party comparison websites)",
    ];
    suggestedQuestions = [
      "Show me a donut chart of channel performance",
      "Show subscriber count for May 2026",
      "What are the top churn drivers?",
      "Explain revenue decline last quarter",
    ];

    if (wantsChart) {
      chartObj = {
        type: "donut",
        title: "Activation Share by Channel (May 2026)",
        selection_reason: "Channel proportion breakdown",
        data: DOMAIN_DATA.channels,
      };
    }
  } else {
    // Default overview
    whatHappened = `For May 2026, **Vodafone Ireland** maintains its market leadership position with **2,142,800 active subscribers** (32.1% market share), **€124.5M monthly revenue**, and positive net movement of **+14,200 subscribers**.`;
    kpis = [
      { label: "Subscribers", value: "2.14M", change: "+14.2K", trend: "up" },
      { label: "Revenue", value: "€124.5M", change: "+2.4%", trend: "up" },
      { label: "ARPU", value: "€21.80", change: "+€0.45", trend: "up" },
      { label: "Churn Rate", value: "15.4%", change: "-0.6%", trend: "down" },
    ];
    summaryBullets = [
      "Market leader in Ireland with 32.1% market share",
      "Total active subscribers at 2,142,800 as of May 2026",
      "Monthly revenue at €124.5M (+2.4% MoM)",
      "Churn rate steady at 15.4% annual",
      "To see a visual chart of any metric, simply say 'show me a chart'",
    ];
    suggestedQuestions = [
      "Show subscriber count for May 2026",
      "What are the top churn drivers?",
      "Show revenue trend for 2026",
      "Show me a chart of channel performance",
      "How does our ARPU compare to competitors?",
    ];

    if (wantsChart) {
      chartObj = {
        type: "bar",
        title: "Vodafone Ireland Key Performance Metrics",
        selection_reason: "Overview visualization",
        data: [
          { label: "Subscribers (x100k)", value: 21.4 },
          { label: "Revenue (€M)", value: 124.5 },
          { label: "ARPU (€)", value: 21.8 },
          { label: "Churn (%)", value: 15.4 },
        ],
      };
    }
  }

  return {
    what_happened: whatHappened,
    kpis: kpis,
    chart: chartObj, // null if user didn't ask for a chart!
    wants_chart: wantsChart,
    root_causes: rootCauses,
    market_analysis: {
      market_position: "Vodafone Ireland holds the #1 market position in Ireland with ~32% market share across mobile subscribers.",
      market_trends: ["5G standalone network expansion", "Growth in converged fixed-mobile bundles", "Intense SIM-only price competition"],
      growth_outlook: "Stable 2-3% annual revenue growth supported by enterprise data and IoT connectivity.",
    },
    competitor_analysis: {
      competitors: DOMAIN_DATA.competitors,
      competitive_advantage: "Superior 5G network reliability, premium brand perception, and extensive retail presence.",
      competitive_risk: "Aggressive short-term discount promotions from Eir and Three targeting budget-conscious consumers.",
    },
    recommendations: recommendations,
    risks: [
      { risk: "Competitor Price Undercutting", severity: "Medium", mitigation: "Emphasize network quality and bundle value-added perks (e.g. roaming & entertainment) rather than engaging in pure price erosion." },
    ],
    summary_bullets: summaryBullets,
    suggested_questions: suggestedQuestions,
    generated_at: new Date().toISOString(),
  };
}
