import type {
  Clause,
  MetadataField,
  MerlinInsight,
  Template,
  Comment,
  Approver,
  ActivityEvent,
  IntakeQA,
} from "./types";

/* ============================================================
   Contract-level facts
   ============================================================ */
export const CONTRACT = {
  id: "PA-2026-04417",
  title: "Purchase Agreement — ABC Manufacturing Pvt. Ltd.",
  type: "Procurement / Purchase Agreement",
  supplier: "ABC Manufacturing Pvt. Ltd.",
  value: "₹2.00 Cr",
  region: "India",
  businessUnit: "Manufacturing",
  entity: "Zycus Infotech Pvt. Ltd. (India)",
  effectiveDate: "01 Aug 2026",
  term: "3 years",
  owner: "Jitendra Kumar",
  ownerRole: "Procurement Manager",
};

/* ============================================================
   Merlin conversational intake (Step 3)
   ============================================================ */
export const INTAKE_SCRIPT: IntakeQA[] = [
  {
    id: "q1",
    question: "What kind of agreement are you creating?",
    answer: "Procurement / Purchase Agreement",
    fills: ["contractType"],
  },
  {
    id: "q2",
    question: "Who is the supplier?",
    answer: "ABC Manufacturing Pvt. Ltd.",
    fills: ["supplierName", "supplierId"],
  },
  {
    id: "q3",
    question: "What's the estimated contract value?",
    answer: "₹2 Crore",
    fills: ["value", "currency"],
  },
  {
    id: "q4",
    question: "Which region and business unit?",
    answer: "India · Manufacturing",
    fills: ["region", "businessUnit", "entity"],
  },
  {
    id: "q5",
    question: "Effective date and duration?",
    answer: "01 Aug 2026, for 3 years",
    fills: ["effectiveDate", "term", "endDate"],
  },
  {
    id: "q6",
    question: "Payment terms requested by the supplier?",
    answer: "Net 90",
    fills: ["paymentTerms"],
  },
  {
    id: "q7",
    question: "Are insurance and data privacy protections required?",
    answer: "Insurance: Yes · Data privacy: Required",
    fills: ["insurance", "dataPrivacy"],
  },
  {
    id: "q8",
    question: "Who is the authorised signer on your side?",
    answer: "",
    missing: true,
    fills: ["signer"],
  },
];

/* ============================================================
   Metadata (Step 4) — grouped, with confidence
   ============================================================ */
export const METADATA: MetadataField[] = [
  // Supplier
  { id: "supplierName", label: "Supplier Name", value: "ABC Manufacturing Pvt. Ltd.", group: "Supplier", confidence: "auto", required: true, source: "Merlin intake" },
  { id: "supplierId", label: "Supplier ID", value: "SUP-004471", group: "Supplier", confidence: "auto", source: "Supplier master", note: "Matched to existing supplier record — 2 active contracts found." },
  { id: "region", label: "Region", value: "India", group: "Supplier", confidence: "auto", required: true, source: "Merlin intake" },
  { id: "businessUnit", label: "Business Unit", value: "Manufacturing", group: "Supplier", confidence: "auto", source: "Merlin intake" },
  { id: "supplierRisk", label: "Supplier Risk Rating", value: "Medium — 62/100", group: "Supplier", confidence: "review", note: "Rating dropped from Low last quarter. Review recommended.", source: "Supplier 360" },

  // Commercial
  { id: "contractType", label: "Contract Type", value: "Procurement / Purchase Agreement", group: "Commercial", confidence: "auto", required: true, source: "Merlin intake" },
  { id: "term", label: "Contract Term", value: "3 years", group: "Commercial", confidence: "auto", required: true, source: "Merlin intake" },
  { id: "paymentTerms", label: "Payment Terms", value: "Net 90", group: "Commercial", confidence: "review", required: true, note: "Supplier-requested Net 90 conflicts with company policy of Net 45.", source: "Merlin intake" },
  { id: "insurance", label: "Insurance Required", value: "Yes", group: "Commercial", confidence: "auto", source: "Merlin intake" },

  // Financial
  { id: "value", label: "Contract Value", value: "₹2.00 Cr", group: "Financial", confidence: "auto", required: true, source: "Merlin intake" },
  { id: "currency", label: "Currency", value: "USD", group: "Financial", confidence: "review", required: true, note: "Currency is USD but value/region are INR/India. Likely should be INR.", source: "Merlin intake" },
  { id: "budgetLine", label: "Budget Line / GL", value: "", group: "Financial", confidence: "missing", required: true, note: "Required for finance approval routing." },

  // Legal
  { id: "entity", label: "Contracting Entity", value: "Zycus Infotech Pvt. Ltd. (India)", group: "Legal", confidence: "auto", source: "Merlin intake" },
  { id: "jurisdiction", label: "Governing Law / Jurisdiction", value: "", group: "Legal", confidence: "missing", required: true, note: "No jurisdiction detected. India region suggests Maharashtra, India." },
  { id: "signer", label: "Authorised Signer", value: "", group: "Legal", confidence: "missing", required: true, note: "Signer not provided during intake." },

  // Renewal
  { id: "effectiveDate", label: "Effective Date", value: "01 Aug 2026", group: "Renewal", confidence: "auto", required: true, source: "Merlin intake" },
  { id: "endDate", label: "End Date", value: "31 Jul 2029", group: "Renewal", confidence: "auto", source: "Merlin intake" },
  { id: "renewal", label: "Renewal Type", value: "Auto-renew (12 months)", group: "Renewal", confidence: "manual" },

  // Compliance
  { id: "dataPrivacy", label: "Data Privacy (DPA)", value: "Required", group: "Compliance", confidence: "auto", required: true, source: "Merlin intake" },
  { id: "sanctions", label: "Sanctions Screening", value: "Cleared", group: "Compliance", confidence: "auto", source: "Compliance engine" },
  { id: "esg", label: "ESG / Code of Conduct", value: "Pending acknowledgement", group: "Compliance", confidence: "review", note: "Supplier has not acknowledged the 2026 Supplier Code of Conduct." },
];

/* ============================================================
   Templates (Step 5)
   ============================================================ */
export const TEMPLATES: Template[] = [
  {
    id: "t1",
    name: "Supplier Agreement — India (FY26)",
    score: 95,
    jurisdiction: "India · Maharashtra",
    version: "v4.2 · Published",
    clauses: 24,
    status: "recommended",
    why: [
      "Matches contract type, region (India) and business unit (Manufacturing)",
      "Includes mandatory DPA + insurance clauses you flagged as required",
      "Used in 38 similar procurement agreements in the last 12 months",
    ],
  },
  {
    id: "t2",
    name: "Master Services Agreement — India",
    score: 90,
    jurisdiction: "India · Maharashtra",
    version: "v3.1 · Published",
    clauses: 31,
    status: "ok",
    why: [
      "Strong India legal coverage and payment-terms flexibility",
      "Heavier than needed — MSA scope exceeds a single purchase agreement",
    ],
  },
  {
    id: "t3",
    name: "Global Procurement Agreement",
    score: 82,
    jurisdiction: "Global · US default",
    version: "v2.0 · Published",
    clauses: 22,
    status: "warning",
    warning: "Default jurisdiction is US — would need India localisation.",
    why: [
      "Covers procurement scope well",
      "Governing law defaults to Delaware, US — mismatch with India region",
    ],
  },
];

/* ============================================================
   Draft-generation steps (Step 6)
   ============================================================ */
export const GENERATION_STEPS = [
  "Selecting template — Supplier Agreement India (FY26)",
  "Injecting supplier & commercial data",
  "Assembling clauses from the India clause library",
  "Validating against company policy",
  "Checking mandatory terms & compliance",
  "Scoring risk and negotiation readiness",
];

/* ============================================================
   Clauses (Step 7 — the document)
   ============================================================ */
export const CLAUSES: Clause[] = [
  {
    id: "c1",
    number: "1",
    title: "Parties & Definitions",
    status: "standard",
    risk: "none",
    approved: true,
    body: "This Purchase Agreement (\"Agreement\") is entered into as of 01 August 2026 by and between Zycus Infotech Pvt. Ltd., a company incorporated under the laws of India (\"Buyer\"), and ABC Manufacturing Pvt. Ltd. (\"Supplier\"). Capitalised terms have the meanings set out in Schedule A.",
  },
  {
    id: "c2",
    number: "2",
    title: "Scope of Supply",
    status: "standard",
    risk: "none",
    approved: true,
    body: "Supplier shall manufacture and deliver the goods described in the Purchase Orders issued under this Agreement, conforming to the specifications, quantities and delivery schedules agreed in writing by the Parties.",
  },
  {
    id: "c3",
    number: "3",
    title: "Pricing & Price Adjustment",
    status: "modified",
    risk: "medium",
    body: "Prices are fixed for the first twelve (12) months. Thereafter, Supplier may propose an annual adjustment not exceeding the change in the Wholesale Price Index, subject to Buyer's written approval.",
    owner: "Priya Nair · Category",
    merlinNote:
      "Price-adjustment cap is open-ended after year 1. Peers cap escalation at WPI + 3%.",
    versions: [
      { id: "v1", label: "v1 · Template standard", author: "Merlin", timestamp: "Draft", summary: "Fixed price, no escalation clause." },
      { id: "v2", label: "v2 · Category edit", author: "Priya Nair", timestamp: "2h ago", summary: "Added annual WPI-linked adjustment." },
    ],
  },
  {
    id: "c4",
    number: "4",
    title: "Payment Terms",
    status: "risk",
    risk: "high",
    nonStandard: true,
    body: "Buyer shall pay all undisputed invoices within ninety (90) days of the invoice date (Net 90).",
    owner: "Rahul Mehta · Finance",
    commentCount: 2,
    merlinNote:
      "Supplier requested Net 90. Company policy for this spend category is Net 45. This is a High commercial risk.",
    activeVariantId: "pv2",
    variants: [
      { id: "pv1", name: "Standard — Net 45", kind: "standard", risk: "low", body: "Buyer shall pay all undisputed invoices within forty-five (45) days of the invoice date (Net 45).", note: "Company policy standard." },
      { id: "pv2", name: "Supplier — Net 90", kind: "custom", risk: "high", body: "Buyer shall pay all undisputed invoices within ninety (90) days of the invoice date (Net 90).", note: "Supplier requested. Exceeds policy." },
      { id: "pv3", name: "Fallback — Net 60", kind: "fallback", risk: "medium", body: "Buyer shall pay all undisputed invoices within sixty (60) days of the invoice date (Net 60).", note: "Approved fallback for strategic suppliers." },
      { id: "pv4", name: "Milestone-based", kind: "fallback", risk: "low", body: "Payment shall be released against delivery and acceptance milestones as set out in Schedule B, each within thirty (30) days of milestone sign-off.", note: "Ties payment to delivery — lowest cash risk." },
    ],
    versions: [
      { id: "v1", label: "v1 · Template standard (Net 45)", author: "Merlin", timestamp: "Draft", summary: "Policy-standard Net 45." },
      { id: "v2", label: "v2 · Supplier redline (Net 90)", author: "Import", timestamp: "1h ago", summary: "Supplier changed to Net 90." },
    ],
  },
  {
    id: "c5",
    number: "5",
    title: "Delivery & Acceptance",
    status: "standard",
    risk: "none",
    body: "Supplier shall deliver goods DDP (Incoterms 2020) to Buyer's designated facility. Buyer may inspect and reject non-conforming goods within ten (10) business days of receipt.",
  },
  {
    id: "c6",
    number: "6",
    title: "Warranties",
    status: "standard",
    risk: "low",
    body: "Supplier warrants that all goods are free from defects in material and workmanship for twelve (12) months from delivery and conform to agreed specifications.",
  },
  {
    id: "c7",
    number: "7",
    title: "Indemnification",
    status: "risk",
    risk: "high",
    nonStandard: true,
    body: "Supplier shall indemnify Buyer against third-party claims arising from defects in the goods, up to the total fees paid under this Agreement in the preceding twelve (12) months.",
    owner: "Ananya Rao · Legal",
    commentCount: 1,
    merlinNote:
      "Indemnity is capped at 12 months' fees. Company standard requires uncapped indemnity for IP and personal-injury claims.",
    versions: [
      { id: "v1", label: "v1 · Supplier paper", author: "Import", timestamp: "1h ago", summary: "Capped indemnity at 12 months' fees." },
    ],
  },
  {
    id: "c8",
    number: "8",
    title: "Limitation of Liability",
    status: "modified",
    risk: "medium",
    body: "Except for the indemnities in Clause 7, neither Party's aggregate liability shall exceed the total value of this Agreement. Neither Party is liable for indirect or consequential loss.",
    merlinNote: "Liability cap references Clause 7 — keep aligned if indemnity changes.",
  },
  {
    id: "c9",
    number: "9",
    title: "Termination",
    status: "risk",
    risk: "high",
    nonStandard: true,
    body: "Either Party may terminate this Agreement for convenience upon thirty (30) days' written notice. Buyer may terminate immediately upon Supplier's material breach.",
    owner: "Ananya Rao · Legal",
    merlinNote:
      "This termination clause differs from the legal standard. Company standard requires 60 days' notice for convenience and a cure period before breach termination.",
    versions: [
      { id: "v1", label: "v1 · Template standard", author: "Merlin", timestamp: "Draft", summary: "60-day notice, 30-day cure." },
      { id: "v2", label: "v2 · Supplier paper", author: "Import", timestamp: "1h ago", summary: "30-day notice, no cure period." },
    ],
  },
  {
    id: "c10",
    number: "10",
    title: "Confidentiality",
    status: "approved",
    risk: "none",
    approved: true,
    body: "Each Party shall keep confidential all non-public information disclosed by the other Party and use it solely for the purposes of this Agreement, for a period of five (5) years after termination.",
  },
  {
    id: "c11",
    number: "11",
    title: "Governing Law & Dispute Resolution",
    status: "standard",
    risk: "low",
    body: "This Agreement is governed by the laws of India. Disputes shall be resolved by arbitration seated in Mumbai under the Arbitration and Conciliation Act, 1996.",
  },
];

/* The policy-standard replacement text applied when a risk fix is accepted */
export const STANDARD_FIX: Record<string, string> = {
  c4: "Buyer shall pay all undisputed invoices within forty-five (45) days of the invoice date (Net 45).",
  c7: "Supplier shall indemnify Buyer against third-party claims arising from the goods. Liability shall be uncapped for claims relating to intellectual-property infringement and personal injury; for all other claims it is capped at the total fees paid under this Agreement in the preceding twelve (12) months.",
  c9: "Either Party may terminate this Agreement for convenience upon sixty (60) days' written notice. Buyer may terminate for material breach only if the breach remains uncured thirty (30) days after written notice.",
};

/* Missing clauses Merlin recommends inserting */
export const MISSING_CLAUSES = [
  {
    id: "m1",
    title: "Data Protection & Privacy (DPA)",
    reason:
      "You marked data privacy as Required, but no DPA clause is present. Mandatory for suppliers processing personal data under India DPDP Act 2023.",
    risk: "high" as const,
  },
  {
    id: "m2",
    title: "Insurance & Coverage",
    reason:
      "Insurance was marked Required in intake. Standard template includes minimum coverage limits — currently absent.",
    risk: "medium" as const,
  },
];

/* ============================================================
   Merlin insights (proactive, workspace-wide)
   ============================================================ */
export const INSIGHTS: MerlinInsight[] = [
  {
    id: "i1",
    type: "risk",
    severity: "high",
    title: "Payment Terms exceed policy",
    detail:
      "Supplier requested Net 90. Company policy for this category is Net 45. High cash-flow and DSO impact.",
    basis: "Policy: Procurement Payment Standard §3.2 · Net 45",
    confidence: 97,
    clauseId: "c4",
    actions: ["goto", "compare", "explain", "escalate"],
  },
  {
    id: "i2",
    type: "risk",
    severity: "high",
    title: "Indemnity differs from company standard",
    detail:
      "Indemnity is capped at 12 months' fees. Standard requires uncapped indemnity for IP and personal-injury claims.",
    basis: "Playbook: Legal Standard Clause Library · Indemnity v7",
    confidence: 96,
    clauseId: "c7",
    actions: ["goto", "compare", "explain", "escalate"],
  },
  {
    id: "i3",
    type: "risk",
    severity: "high",
    title: "Termination clause non-standard",
    detail:
      "30-day convenience notice with no cure period. Standard is 60-day notice with a 30-day cure period.",
    basis: "Playbook: Legal Standard Clause Library · Termination v3",
    confidence: 97,
    clauseId: "c9",
    actions: ["goto", "compare", "explain"],
  },
  {
    id: "i4",
    type: "missing",
    severity: "high",
    title: "Missing clause — Data Protection (DPA)",
    detail:
      "Data privacy was marked Required but no DPA clause is present. Mandatory under DPDP Act 2023.",
    basis: "Compliance: India DPDP Act 2023 · Mandatory",
    confidence: 99,
    actions: ["accept", "explain"],
  },
  {
    id: "i5",
    type: "missing",
    severity: "medium",
    title: "Missing clause — Insurance & Coverage",
    detail:
      "Insurance marked Required in intake but coverage clause is absent from the draft.",
    basis: "Template: Supplier Agreement India · Clause 14",
    confidence: 92,
    actions: ["accept", "explain"],
  },
  {
    id: "i6",
    type: "benchmark",
    severity: "low",
    title: "Supplier usually accepts Net 45",
    detail:
      "Across 2 prior contracts, ABC Manufacturing agreed to Net 45. Net 90 is unusual for this supplier.",
    basis: "Supplier history: 2 contracts (2024, 2025)",
    confidence: 88,
    clauseId: "c4",
    actions: ["explain"],
  },
];

/* ============================================================
   Collaboration & governance
   ============================================================ */
export const COMMENTS: Comment[] = [
  { id: "cm1", clauseId: "c4", author: "Rahul Mehta", role: "Finance", body: "Net 90 will hurt our DSO target this quarter. Can we push for Net 60?", timestamp: "1h ago", resolved: false, mentions: ["Jitendra Kumar"] },
  { id: "cm2", clauseId: "c4", author: "Jitendra Kumar", role: "Procurement", body: "Agreed. Proposing Net 60 fallback to the supplier.", timestamp: "45m ago", resolved: false },
  { id: "cm3", clauseId: "c7", author: "Ananya Rao", role: "Legal", body: "Capped indemnity is a blocker. Needs uncapped carve-out for IP.", timestamp: "30m ago", resolved: false, mentions: ["Jitendra Kumar"] },
];

export const APPROVERS: Approver[] = [
  { id: "a1", name: "Priya Nair", role: "Category Manager", stage: 1, status: "ready" },
  { id: "a2", name: "Rahul Mehta", role: "Finance Controller", stage: 2, status: "pending", note: "Awaiting Net terms resolution" },
  { id: "a3", name: "Ananya Rao", role: "Legal Counsel", stage: 3, status: "on-leave", note: "On leave until 22 Jul — delegate available" },
  { id: "a4", name: "Vikram Shah", role: "Business Owner (VP)", stage: 4, status: "ready" },
];

export const ACTIVITY: ActivityEvent[] = [
  { id: "e1", actor: "Merlin", action: "generated draft from", target: "Supplier Agreement India (FY26)", timestamp: "1h ago", kind: "ai" },
  { id: "e2", actor: "Merlin", action: "flagged 3 risks and 2 missing clauses", timestamp: "1h ago", kind: "risk" },
  { id: "e3", actor: "Import", action: "applied supplier redlines to", target: "Payment Terms, Termination", timestamp: "1h ago", kind: "edit" },
  { id: "e4", actor: "Rahul Mehta", action: "commented on", target: "Payment Terms", timestamp: "1h ago", kind: "comment" },
  { id: "e5", actor: "Priya Nair", action: "edited", target: "Pricing & Price Adjustment", timestamp: "2h ago", kind: "edit" },
  { id: "e6", actor: "Ananya Rao", action: "commented on", target: "Indemnification", timestamp: "30m ago", kind: "comment" },
];

/* ============================================================
   Landing dashboard data
   ============================================================ */
export const RECENT_CONTRACTS = [
  { id: "PA-2026-04417", title: "ABC Manufacturing — Purchase Agreement", status: "Draft", risk: "high", value: "₹2.00 Cr", updated: "Just now", health: 72, isDraft: true },
  { id: "MSA-2026-03310", title: "Cloudspring Technologies — MSA", status: "In Approval", risk: "low", value: "₹85.00 L", updated: "2h ago", health: 96, isDraft: false },
  { id: "NDA-2026-09112", title: "Meridian Logistics — Mutual NDA", status: "Signed", risk: "low", value: "—", updated: "Yesterday", health: 100, isDraft: false },
  { id: "PA-2026-04390", title: "Orbit Components — Purchase Agreement", status: "In Review", risk: "medium", value: "₹1.20 Cr", updated: "2 days ago", health: 84, isDraft: false },
  { id: "PA-2026-04201", title: "Delta Freight — Purchase Agreement", status: "In Review", risk: "medium", value: "₹95.00 L", updated: "3 days ago", health: 81, isDraft: false },
  { id: "MSA-2026-03188", title: "Nimbus Steel — Master Services Agreement", status: "Signed", risk: "low", value: "₹3.40 Cr", updated: "5 days ago", health: 100, isDraft: false },
  { id: "SOW-2026-02871", title: "Apex Digital — Statement of Work", status: "Draft", risk: "medium", value: "₹42.00 L", updated: "6 days ago", health: 68, isDraft: true },
  { id: "NDA-2026-09077", title: "Vertex Systems — Mutual NDA", status: "Signed", risk: "low", value: "—", updated: "1 week ago", health: 100, isDraft: false },
  { id: "PA-2026-04014", title: "Crest Manufacturing — Purchase Agreement", status: "In Approval", risk: "low", value: "₹1.75 Cr", updated: "1 week ago", health: 93, isDraft: false },
  { id: "MSA-2026-02991", title: "BluePeak Consulting — MSA", status: "Draft", risk: "high", value: "₹1.10 Cr", updated: "8 days ago", health: 64, isDraft: true },
  { id: "PA-2026-03862", title: "Silverline Parts — Purchase Agreement", status: "Signed", risk: "low", value: "₹88.00 L", updated: "10 days ago", health: 100, isDraft: false },
  { id: "SLA-2026-02041", title: "Infranet Services — SLA", status: "In Review", risk: "medium", value: "₹54.00 L", updated: "11 days ago", health: 79, isDraft: false },
  { id: "NDA-2026-08830", title: "Northwind Labs — NDA", status: "Signed", risk: "low", value: "—", updated: "12 days ago", health: 100, isDraft: false },
  { id: "PA-2026-03625", title: "Summit Polymers — Purchase Agreement", status: "Draft", risk: "medium", value: "₹76.00 L", updated: "13 days ago", health: 71, isDraft: true },
  { id: "MSA-2026-02754", title: "QuantaEdge Technologies — MSA", status: "In Approval", risk: "low", value: "₹1.95 Cr", updated: "2 weeks ago", health: 94, isDraft: false },
  { id: "PA-2026-03408", title: "Everon Components — Purchase Agreement", status: "Signed", risk: "low", value: "₹63.00 L", updated: "2 weeks ago", health: 100, isDraft: false },
  { id: "DPA-2026-01872", title: "DataCore Analytics — DPA", status: "In Review", risk: "medium", value: "—", updated: "16 days ago", health: 82, isDraft: false },
  { id: "PA-2026-03211", title: "Falcon Mobility — Purchase Agreement", status: "Draft", risk: "high", value: "₹2.35 Cr", updated: "17 days ago", health: 66, isDraft: true },
  { id: "NDA-2026-08719", title: "Kinetic Warehousing — Mutual NDA", status: "Signed", risk: "low", value: "—", updated: "18 days ago", health: 100, isDraft: false },
  { id: "MSA-2026-02566", title: "Asterix Solutions — MSA", status: "Signed", risk: "low", value: "₹1.22 Cr", updated: "3 weeks ago", health: 100, isDraft: false },
];

/* Contracts available to duplicate from */
export const DUPLICATABLE = [
  { id: "PA-2026-04390", title: "Orbit Components — Purchase Agreement", type: "Purchase Agreement", supplier: "Orbit Components", value: "₹1.20 Cr", region: "India", clauses: 11, updated: "2 days ago", status: "In Review" },
  { id: "PA-2025-03980", title: "Delta Freight — Purchase Agreement", type: "Purchase Agreement", supplier: "Delta Freight Pvt. Ltd.", value: "₹95.00 L", region: "India", clauses: 10, updated: "3 weeks ago", status: "Signed" },
  { id: "MSA-2026-03310", title: "Cloudspring Technologies — MSA", type: "Master Services Agreement", supplier: "Cloudspring Technologies", value: "₹85.00 L", region: "India", clauses: 18, updated: "2h ago", status: "In Approval" },
  { id: "PA-2025-02214", title: "Nimbus Steel — Purchase Agreement", type: "Purchase Agreement", supplier: "Nimbus Steel Ltd.", value: "₹3.40 Cr", region: "India", clauses: 12, updated: "2 months ago", status: "Signed" },
  { id: "NDA-2026-09112", title: "Meridian Logistics — Mutual NDA", type: "NDA", supplier: "Meridian Logistics", value: "—", region: "India", clauses: 6, updated: "Yesterday", status: "Signed" },
];

export const RECENT_SUPPLIERS = [
  { name: "ABC Manufacturing Pvt. Ltd.", contracts: 2, risk: "medium", region: "India" },
  { name: "Cloudspring Technologies", contracts: 5, risk: "low", region: "India" },
  { name: "Orbit Components", contracts: 1, risk: "medium", region: "India" },
];

export const DASH_RECS = [
  { id: "d1", title: "2 renewals due in 30 days", detail: "Orbit Components and Meridian Logistics contracts expire soon.", tone: "warning" as const },
  { id: "d2", title: "Net 45 is your standard", detail: "3 recent drafts used non-standard payment terms. Consider a policy nudge.", tone: "info" as const },
  { id: "d3", title: "Supplier risk changed", detail: "ABC Manufacturing risk rating moved Low → Medium last quarter.", tone: "high" as const },
];

export const PENDING_APPROVALS = [
  { id: "MSA-2026-03310", title: "Cloudspring Technologies — MSA", from: "Neha Gupta", stage: "Finance sign-off", waiting: "2h" },
  { id: "PA-2026-04201", title: "Delta Freight — Purchase Agreement", from: "Arjun Patel", stage: "Legal review", waiting: "1d" },
];
