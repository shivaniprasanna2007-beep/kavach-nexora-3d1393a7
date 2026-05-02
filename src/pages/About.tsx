import MarketingPage from "@/components/MarketingPage";

const About = () => (
  <MarketingPage
    title="About KAVACH"
    metaTitle="About KAVACH — Hospital bill auditor for India"
    metaDescription="KAVACH is an AI-powered hospital bill auditor and claims navigator built for Indian patients and families."
    intro="We started KAVACH because no Indian family should have to choose between trusting a confusing hospital bill and fighting a system they don't understand."
  >
    <h2>Why we built this</h2>
    <p>
      Every year, thousands of Indian families pay more than they should for hospital care — duplicate line items,
      inflated procedure costs, and missed insurance coverage all add up. Most patients never know. KAVACH reads your
      bill the way an experienced auditor would, in seconds, and tells you exactly what to do next.
    </p>
    <h2>What we do</h2>
    <ul>
      <li>Scan and OCR hospital bills in any language and any format</li>
      <li>Compare line items against fair market and CGHS/PMJAY reference rates</li>
      <li>Flag overcharges, duplicates and unbundled charges</li>
      <li>Suggest insurance and government scheme eligibility</li>
      <li>Generate dispute letters and claim documents on demand</li>
    </ul>
    <h2>Who we serve</h2>
    <p>
      Patients, caregivers and family members navigating bills from any hospital in India. KAVACH is free to start —
      you only pay if you choose advanced features.
    </p>
    <h2>Built with care</h2>
    <p>
      We don't sell your data. Bills are stored encrypted and only visible to you. Read our{" "}
      <a href="/privacy">privacy policy</a> for details.
    </p>
  </MarketingPage>
);

export default About;