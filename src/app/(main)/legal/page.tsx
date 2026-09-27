import type { Metadata } from "next";
import { COMPANY, TERMS_VERSION } from "@/lib/shop-info";
import { LegalDoc, LegalSection, MailLink, PhoneLink, TextLink } from "@/components/legal/LegalDoc";
import { CookieSettings } from "@/components/legal/CookieSettings";

export const metadata: Metadata = {
  title: "KANSLIET (LEGAL)",
  description: "Company information and cookie policy for Kansliet.",
  alternates: { canonical: "/legal" },
};

// Plain uppercase, not .text-caps: its display: inline-block breaks table cell layout.
const TH = "py-2 pr-4 align-top text-sm font-light uppercase tracking-wider opacity-60";
const TD = "py-3 pr-4 align-top";

const COOKIES = [
  { name: "cart", purpose: "Remembers what's in your cart", type: "Necessary", lasts: "30 days" },
  { name: "session", purpose: "Keeps our staff logged in to the admin", type: "Necessary", lasts: "30 days" },
  { name: "cookie-consent", purpose: "Remembers your cookie choice (stored in your browser, not sent to us)", type: "Necessary", lasts: "Until you clear it" },
  { name: "_ga, _ga_*", purpose: "Google Analytics: counts visits and how the site is used", type: "Analytics, only with consent", lasts: "Up to 2 years" },
];

export default function LegalPage() {
  return (
    <LegalDoc title="LEGAL" updated={TERMS_VERSION}>
      <LegalSection id="company" title="COMPANY INFORMATION">
        <p>
          {COMPANY.legalName}
          <br />
          Org.nr {COMPANY.orgNr}
          <br />
          VAT {COMPANY.vatNr}
          <br />
          {COMPANY.address.map((line) => (
            <span key={line}>
              {line}
              <br />
            </span>
          ))}
          <MailLink />
          <br />
          <PhoneLink />
        </p>
        <p>
          Store purchases are covered by our <TextLink href="/terms">terms of sale</TextLink>, and
          personal data by our <TextLink href="/privacy">privacy policy</TextLink>.
        </p>
      </LegalSection>

      <LegalSection id="cookies" title="COOKIES">
        <p>
          Necessary cookies make the store work and are always on. Analytics cookies (Google
          Analytics) are only set after you accept them in the banner, and you can change your
          choice here at any time.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[32rem] text-left text-sm">
            <thead className="border-b-brutal">
              <tr>
                <th className={TH}>NAME</th>
                <th className={TH}>PURPOSE</th>
                <th className={TH}>TYPE</th>
                <th className={TH}>LASTS</th>
              </tr>
            </thead>
            <tbody>
              {COOKIES.map((cookie) => (
                <tr key={cookie.name} className="border-b border-foreground/10">
                  <td className={`${TD} whitespace-nowrap`}>{cookie.name}</td>
                  <td className={TD}>{cookie.purpose}</td>
                  <td className={TD}>{cookie.type}</td>
                  <td className={TD}>{cookie.lasts}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <CookieSettings />
      </LegalSection>

      <LegalSection id="contact" title="CONTACT">
        <p>
          Questions about data, cookies or an order: <MailLink />.
        </p>
      </LegalSection>
    </LegalDoc>
  );
}
