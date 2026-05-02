import MarketingPage from "@/components/MarketingPage";

const Terms = () => (
  <MarketingPage
    title="Terms of service"
    metaTitle="Terms of service · KAVACH"
    metaDescription="The terms governing your use of KAVACH, our hospital bill auditor and claims navigator."
    intro="Last updated: May 2026"
  >
    <h2>Using KAVACH</h2>
    <p>
      KAVACH is an information tool. The audits, savings estimates and scheme suggestions we provide are guidance —
      not legal, medical or financial advice. Always verify amounts with the hospital, your insurer or a qualified
      professional before making decisions.
    </p>
    <h2>Your account</h2>
    <ul>
      <li>You're responsible for keeping your login credentials secure.</li>
      <li>You must be at least 18 years old, or use the service with a guardian's consent.</li>
      <li>One account per person. Family linking is supported within an account.</li>
    </ul>
    <h2>Acceptable use</h2>
    <ul>
      <li>Don't upload bills that aren't yours or that you don't have permission to audit.</li>
      <li>Don't attempt to reverse-engineer or abuse our APIs or AI systems.</li>
      <li>Don't use KAVACH for any illegal activity.</li>
    </ul>
    <h2>Limitation of liability</h2>
    <p>
      KAVACH is provided "as is". We do our best to be accurate but we can't guarantee that every overcharge will be
      caught or that every scheme suggestion will be approved. To the maximum extent permitted by law, our liability
      is limited to the amount you've paid us in the 12 months before any claim.
    </p>
    <h2>Changes</h2>
    <p>
      We may update these terms. Material changes will be announced via email or in the app at least 14 days before
      taking effect.
    </p>
    <h2>Contact</h2>
    <p>
      Questions? Email <a href="mailto:legal@kavach.app">legal@kavach.app</a>.
    </p>
  </MarketingPage>
);

export default Terms;