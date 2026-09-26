import type { Metadata } from "next";
import { COMPANY, TERMS_VERSION } from "@/lib/shop-info";
import { LegalDoc, LegalList, LegalSection, MailLink, TextLink } from "@/components/legal/LegalDoc";

export const metadata: Metadata = {
  title: "KANSLIET (PRIVACY)",
  description: "How Kansliet handles personal data: what we collect, why, who we share it with and your rights.",
  alternates: { canonical: "/privacy" },
};

// Plain uppercase, not .text-caps: its display: inline-block breaks table cell layout.
const TH = "py-2 pr-4 align-top text-sm font-light uppercase tracking-wider opacity-60";
const TD = "py-3 pr-4 align-top";

const PURPOSES = [
  {
    what: "Placing and delivering orders",
    data: "Name, email, shipping address, what you bought, payment status (not card details)",
    basis: "Contract (GDPR art. 6.1 b)",
    kept: "7 years after the end of the financial year (Swedish Bookkeeping Act)",
  },
  {
    what: "Handling returns and complaints",
    data: "Order details and what you tell us",
    basis: "Contract and legal obligation (art. 6.1 b, c)",
    kept: "Until settled, then as accounting records",
  },
  {
    what: "Answering the contact form or email",
    data: "Name, email, company, your message",
    basis: "Legitimate interest in replying (art. 6.1 f)",
    kept: "Up to 2 years after our last contact",
  },
  {
    what: "Site analytics (only if you accept)",
    data: "Pages visited, device and browser, approximate location, a random ID",
    basis: "Consent (art. 6.1 a)",
    kept: "Up to 14 months in Google Analytics",
  },
];

export default function PrivacyPage() {
  return (
    <LegalDoc
      title="PRIVACY POLICY"
      updated={TERMS_VERSION}
      intro={
        <p>
          This policy explains how {COMPANY.legalName} handles personal data when you visit{" "}
          {COMPANY.website}, contact us or buy from the store.
        </p>
      }
    >
      <LegalSection id="controller" title="WHO IS RESPONSIBLE">
        <p>
          {COMPANY.legalName} (org.nr {COMPANY.orgNr}), {COMPANY.address.join(", ")}, is the
          controller for your personal data. Questions or requests: <MailLink />.
        </p>
      </LegalSection>

      <LegalSection id="purposes" title="WHAT WE COLLECT AND WHY">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[36rem] text-left text-sm">
            <thead className="border-b-brutal">
              <tr>
                <th className={TH}>PURPOSE</th>
                <th className={TH}>DATA</th>
                <th className={TH}>LEGAL BASIS</th>
                <th className={TH}>KEPT FOR</th>
              </tr>
            </thead>
            <tbody>
              {PURPOSES.map((row) => (
                <tr key={row.what} className="border-b border-foreground/10">
                  <td className={TD}>{row.what}</td>
                  <td className={TD}>{row.data}</td>
                  <td className={TD}>{row.basis}</td>
                  <td className={TD}>{row.kept}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p>
          We don&apos;t sell personal data, use it for automated decisions, or send marketing
          without asking.
        </p>
      </LegalSection>

      <LegalSection id="recipients" title="WHO WE SHARE IT WITH">
        <p>Only the services needed to run the site and the store:</p>
        <LegalList
          items={[
            <>
              <strong className="font-normal">Stripe</strong> processes payments. For fraud
              prevention and its legal duties as a payment provider, Stripe is also an independent
              controller (<TextLink href="https://stripe.com/privacy">stripe.com/privacy</TextLink>).
            </>,
            <>
              <strong className="font-normal">Vercel</strong> hosts the site and its database.
            </>,
            <>
              <strong className="font-normal">Resend</strong> sends order confirmations and
              delivers contact form messages to us.
            </>,
            <>
              <strong className="font-normal">Google</strong> provides Google Analytics, only if you
              accept analytics cookies.
            </>,
            <>
              <strong className="font-normal">The carrier</strong> delivering your parcel gets your
              name, address and, where needed, email for delivery notices.
            </>,
            <>Our accountant and authorities, where the law requires it.</>,
          ]}
        />
        <p>
          Some of these providers are based in the US. Transfers there rely on the EU–US Data
          Privacy Framework or the European Commission&apos;s standard contractual clauses.
        </p>
      </LegalSection>

      <LegalSection id="cookies" title="COOKIES">
        <p>
          The store uses a cart cookie and, for our staff, a login cookie. Both are needed for the
          site to work, so they don&apos;t need consent. Analytics cookies are only set if you
          accept them. Details are on the <TextLink href="/legal#cookies">cookies page</TextLink>.
        </p>
      </LegalSection>

      <LegalSection id="rights" title="YOUR RIGHTS">
        <p>Under the GDPR you can ask us to:</p>
        <LegalList
          items={[
            "give you a copy of the personal data we hold about you (access)",
            "correct data that is wrong (rectification)",
            "delete your data, where we are not required to keep it (erasure)",
            "limit how we use it (restriction)",
            "hand it over in a machine-readable format (portability)",
            "stop using it where we rely on legitimate interest (objection)",
          ]}
        />
        <p>
          You can withdraw consent to analytics at any time; this doesn&apos;t affect processing
          before you withdrew it. Email <MailLink />; we reply within one month. Order records we
          must keep for accounting can&apos;t be deleted before the legal period ends.
        </p>
        <p>
          You can complain to the Swedish Authority for Privacy Protection (Integritetsskyddsmyndigheten,
          IMY), <TextLink href="https://www.imy.se">imy.se</TextLink>, or the data protection
          authority where you live.
        </p>
      </LegalSection>
    </LegalDoc>
  );
}
