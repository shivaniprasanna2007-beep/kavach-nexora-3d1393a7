import MarketingPage from "@/components/MarketingPage";

const Privacy = () => (
  <MarketingPage
    title="Privacy policy"
    metaTitle="Privacy policy · KAVACH"
    metaDescription="How KAVACH collects, uses and protects your hospital bills and personal data."
    intro="Last updated: May 2026"
  >
    <h2>What we collect</h2>
    <ul>
      <li>Account information: email, phone number (for OTP), full name and preferred language.</li>
      <li>Bills you upload: PDFs and images stored in a private encrypted bucket.</li>
      <li>Audit data: extracted line items, overcharge estimates and AI-generated explanations.</li>
      <li>Claim and reminder data you create.</li>
    </ul>
    <h2>How we use it</h2>
    <p>
      Strictly to provide the auditing, claim and reminder features you've asked for. We do not sell your data. We do
      not show ads. We don't use your bills to train third-party AI models.
    </p>
    <h2>How it's stored</h2>
    <p>
      Files are stored in a private bucket and only your authenticated account can read them. Database access is
      protected with row-level security so only you can see your records.
    </p>
    <h2>Sharing</h2>
    <p>
      We share data only with sub-processors strictly required to operate the product (AI inference, email delivery).
      They are bound by confidentiality and process data on our behalf.
    </p>
    <h2>Your rights</h2>
    <ul>
      <li>Delete any bill, claim or reminder from the app at any time.</li>
      <li>Email <a href="mailto:privacy@kavach.app">privacy@kavach.app</a> to request full account deletion.</li>
      <li>Export your data on request.</li>
    </ul>
    <h2>Contact</h2>
    <p>
      Questions? Write to <a href="mailto:privacy@kavach.app">privacy@kavach.app</a>.
    </p>
  </MarketingPage>
);

export default Privacy;