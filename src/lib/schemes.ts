// Static scheme guides + claim letter templates (no AI call needed).
// Saves credits — these never change per user.

export type SchemeGuide = {
  id: string;
  name: string;
  short: string;
  description: string;
  eligibility: string[];
  documents: string[];
  steps: string[];
  letterTemplate: (vars: LetterVars) => string;
};

export type LetterVars = {
  patientName: string;
  hospitalName: string;
  billDate: string;
  billNumber: string;
  amountClaimed: string;
  policyOrId: string;
  contact: string;
  todayDate: string;
};

const sig = (v: LetterVars) =>
  `\n\nSincerely,\n${v.patientName}\nContact: ${v.contact}\nDate: ${v.todayDate}`;

export const SCHEMES: SchemeGuide[] = [
  {
    id: "pmjay",
    name: "Ayushman Bharat — PMJAY",
    short: "Up to ₹5L per family per year for secondary & tertiary care.",
    description:
      "Pradhan Mantri Jan Arogya Yojana provides cashless hospitalization to eligible families across empanelled hospitals.",
    eligibility: [
      "Listed in the SECC 2011 deprivation database",
      "Possession of a valid PMJAY / Ayushman card",
      "Treatment must be at an empanelled hospital",
    ],
    documents: [
      "Ayushman card / e-card",
      "Aadhaar of patient",
      "Hospital bill and discharge summary",
      "Itemised pharmacy bills and diagnostic reports",
    ],
    steps: [
      "Verify your eligibility on pmjay.gov.in or via your Ayushman card",
      "Confirm the hospital is empanelled under PMJAY",
      "Submit your Ayushman card at the hospital's PMJAY desk",
      "Request a pre-authorisation request before discharge if not already filed",
      "If denied, submit the application letter with all supporting documents to the State Health Authority",
    ],
    letterTemplate: (v) =>
      `To,
The State Health Authority,
Pradhan Mantri Jan Arogya Yojana (PMJAY)

Subject: Application for reimbursement / claim under PMJAY — Patient ${v.patientName}

Respected Sir/Madam,

I, ${v.patientName}, am a beneficiary under the Ayushman Bharat — PMJAY scheme (Card / Family ID: ${v.policyOrId}). I was treated at ${v.hospitalName} and a bill dated ${v.billDate} (Bill No. ${v.billNumber}) was raised for an amount of ${v.amountClaimed}.

I respectfully request that this expense be processed under the PMJAY scheme as per my entitlement. I am attaching the hospital bill, discharge summary, itemised pharmacy and diagnostic bills, and a copy of my Ayushman card and Aadhaar for your kind reference.

Kindly acknowledge receipt of this application and process the claim at the earliest. I am happy to share any further documentation that may be required.${sig(v)}`,
  },
  {
    id: "cghs",
    name: "CGHS — Central Govt Health Scheme",
    short: "Cashless / reimbursable care for central government employees and pensioners.",
    description:
      "The Central Government Health Scheme provides comprehensive medical care to central government employees, pensioners and their dependents.",
    eligibility: [
      "Active CGHS card holder (employee, pensioner, or dependent)",
      "Treatment at CGHS-empanelled hospital or with prior referral",
    ],
    documents: [
      "CGHS card",
      "Original hospital bill, discharge summary",
      "Investigation reports",
      "Referral / permission letter (if applicable)",
    ],
    steps: [
      "Verify the hospital is CGHS-empanelled",
      "Obtain a referral or emergency certificate where required",
      "Submit Form Med-97/2004 along with original bills to your CGHS Wellness Centre",
      "Track the claim via the CGHS portal using your beneficiary ID",
    ],
    letterTemplate: (v) =>
      `To,
The Additional Director (CGHS),
Wellness Centre — Concerned Zone

Subject: Reimbursement claim under CGHS — Beneficiary ${v.patientName}, Card No. ${v.policyOrId}

Respected Sir/Madam,

I, ${v.patientName}, CGHS beneficiary (Card No. ${v.policyOrId}), underwent treatment at ${v.hospitalName}. Bill No. ${v.billNumber} dated ${v.billDate} for ${v.amountClaimed} is enclosed for your reference.

I request you to kindly process the reimbursement of this expense as per CGHS rates and applicable rules. The originals of the hospital bill, discharge summary, diagnostic reports and referral letter are attached. I am available for any additional clarification or document.${sig(v)}`,
  },
  {
    id: "esi",
    name: "ESI — Employees' State Insurance",
    short: "Medical care for organised-sector employees earning up to ₹21,000/month.",
    description:
      "ESIC provides cash and medical benefits to insured workers and their dependents under the ESI Act.",
    eligibility: [
      "Insured person under ESI Act (active IP / dependent)",
      "Treatment at ESI dispensary, hospital or empanelled tie-up hospital",
    ],
    documents: [
      "ESI Pehchan card / IP number",
      "Original hospital bills, discharge summary",
      "Referral from ESI Dispensary (where applicable)",
    ],
    steps: [
      "Visit the local ESIS dispensary with your IP number to obtain a referral",
      "Avail cashless treatment at the tied-up hospital where possible",
      "For reimbursement, file Form 9A and supporting documents at your Branch Office",
    ],
    letterTemplate: (v) =>
      `To,
The Branch Manager,
ESIC Branch Office

Subject: Medical reimbursement — IP No. ${v.policyOrId}, ${v.patientName}

Respected Sir/Madam,

I, ${v.patientName} (Insured Person No. ${v.policyOrId}), underwent treatment at ${v.hospitalName} on ${v.billDate}. A hospital bill (Bill No. ${v.billNumber}) of ${v.amountClaimed} was raised, which I have settled out of pocket.

I request you to kindly process the reimbursement of this expense under the Employees' State Insurance scheme. Originals of the bill, discharge summary, diagnostic reports and referral letter are attached.${sig(v)}`,
  },
  {
    id: "insurance",
    name: "Private Health Insurance — Reimbursement",
    short: "Standard reimbursement claim with your insurer / TPA.",
    description:
      "Most health insurance policies offer cashless treatment at network hospitals or reimbursement at any registered hospital.",
    eligibility: [
      "Active policy with adequate sum insured",
      "Treatment at a registered hospital (network or non-network)",
    ],
    documents: [
      "Filled claim form",
      "Original hospital bill and discharge summary",
      "Itemised pharmacy and diagnostic bills",
      "Doctor's prescriptions and reports",
      "Policy copy and KYC",
    ],
    steps: [
      "Notify your insurer / TPA within the timeline mentioned in the policy (usually 24–48 hours)",
      "Collect all originals at discharge",
      "Submit the filled claim form with documents to the TPA / insurer",
      "Track the claim using the claim reference number",
    ],
    letterTemplate: (v) =>
      `To,
The Claims Manager,
(Insurer / TPA)

Subject: Reimbursement claim under policy ${v.policyOrId} — ${v.patientName}

Respected Sir/Madam,

I, ${v.patientName}, am the policyholder of insurance policy ${v.policyOrId}. I was hospitalized at ${v.hospitalName}, and Bill No. ${v.billNumber} dated ${v.billDate} for ${v.amountClaimed} is enclosed.

I am submitting the duly filled claim form along with originals of the hospital bill, discharge summary, itemised pharmacy and diagnostic bills, and KYC documents. Kindly process the reimbursement at the earliest and share the claim reference number for tracking.${sig(v)}`,
  },
];

export const getScheme = (id: string) => SCHEMES.find((s) => s.id === id);

export const buildVars = (overrides: Partial<LetterVars>): LetterVars => ({
  patientName: "[Patient name]",
  hospitalName: "[Hospital name]",
  billDate: "[Bill date]",
  billNumber: "[Bill number]",
  amountClaimed: "[Amount in INR]",
  policyOrId: "[Policy / Card number]",
  contact: "[Phone / email]",
  todayDate: new Date().toLocaleDateString("en-IN"),
  ...overrides,
});