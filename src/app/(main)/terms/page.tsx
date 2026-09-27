import type { Metadata } from "next";
import {
  COMPANY,
  COMPLAINT_YEARS,
  COUNTRY_NAMES,
  DEFECT_PRESUMPTION_YEARS,
  DISPATCH_DAYS,
  SHIPPING_REGIONS,
  TERMS_VERSION,
  VAT_RATE_PERCENT,
  WITHDRAWAL_DAYS,
  WITHDRAW_PATH,
  formatMoney,
} from "@/lib/shop-info";
import { MODEL_WITHDRAWAL_FORM, WITHDRAWAL_PARAGRAPHS } from "@/lib/legal-text";
import { LegalDoc, LegalSection, MailLink, TextLink } from "@/components/legal/LegalDoc";

export const metadata: Metadata = {
  title: "KANSLIET (TERMS OF SALE)",
  description: "Terms of sale for the Kansliet store: prices, delivery, returns and your consumer rights.",
  alternates: { canonical: "/terms" },
};

// Plain uppercase, not .text-caps: its display: inline-block breaks table cell layout.
const TH = "py-2 pr-4 text-sm font-light uppercase tracking-wider opacity-60";

export default function TermsPage() {
  const customsCountries = SHIPPING_REGIONS.filter((r) => r.customs)
    .flatMap((r) => r.countries)
    .map((c) => COUNTRY_NAMES[c] ?? c);
  const exports = customsCountries.length > 0;

  // Section 6 exists only while a non-EU country is enabled, so number the
  // sections (and cross-references) from the list rather than by hand.
  const order = [
    "seller", "prices", "ordering", "payment", "delivery",
    ...(exports ? ["customs"] : []),
    "withdrawal", "complaints", "liability", "privacy", "disputes",
  ];
  const n = (id: string) => order.indexOf(id) + 1;

  return (
    <LegalDoc
      title="TERMS OF SALE"
      updated={TERMS_VERSION}
      intro={
        <p>
          These terms apply when you buy from the Kansliet store at {COMPANY.website} as a
          consumer. They don&apos;t limit the rights you have under the consumer law of your
          country of residence. The terms in force on the day you place your order apply to that
          order.
        </p>
      }
    >
      <LegalSection id="seller" title={`${n("seller")}. THE SELLER`}>
        <p>
          {COMPANY.legalName}
          <br />
          Org.nr {COMPANY.orgNr} · VAT {COMPANY.vatNr}
          <br />
          {COMPANY.address.map((line) => (
            <span key={line}>
              {line}
              <br />
            </span>
          ))}
          <MailLink />
        </p>
      </LegalSection>

      <LegalSection id="prices" title={`${n("prices")}. PRICES AND VAT`}>
        <p>
          Prices are in Swedish kronor (SEK) and include {VAT_RATE_PERCENT}% Swedish VAT. Shipping
          is added in the cart and shown, with the total, before you pay. At checkout, our payment
          provider Stripe may offer the total in your local currency at that day&apos;s exchange
          rate; you can choose to pay in SEK instead.
          {exports &&
            ` Orders shipped outside the EU are exported without Swedish VAT; the price stays the same, and import charges in the destination country are covered in section ${n("customs")}.`}
        </p>
        <p>
          If a price is obviously wrong (for example, because of a typing error), we are not bound
          by it. We will tell you and you can choose to cancel the order for a full refund.
        </p>
      </LegalSection>

      <LegalSection id="ordering" title={`${n("ordering")}. ORDERING AND THE CONTRACT`}>
        <p>
          You place an order by paying at checkout. The contract is formed when we email you an
          order confirmation. It contains your order details and these terms, and we recommend
          keeping it. If we can&apos;t deliver an item (for example, it has sold out at the same
          moment), we will tell you straight away and refund you in full.
        </p>
        <p>
          Ordering takes three steps: add items to the cart; choose your country and accept these
          terms; then pay on Stripe&apos;s checkout page. Until you pay, you can change quantities
          or remove items in the cart, and Stripe shows your details and the total for you to
          check before you confirm. The contract is in English. We keep a record of your order and
          of the version of these terms you accepted; your copy is the confirmation email, and we
          will send it again if you ask.
        </p>
        <p>You must be at least 18 years old, or have a guardian&apos;s consent, to order.</p>
      </LegalSection>

      <LegalSection id="payment" title={`${n("payment")}. PAYMENT`}>
        <p>
          Payment is handled by Stripe, and the methods available are shown at checkout. You are
          charged when you place the order. We never see or store your full card details.
        </p>
      </LegalSection>

      <LegalSection id="delivery" title={`${n("delivery")}. DELIVERY`}>
        <p>
          We dispatch orders within {DISPATCH_DAYS} business days. Estimated delivery times from
          dispatch:
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b-brutal">
              <tr>
                <th className={TH}>DESTINATION</th>
                <th className={TH}>SHIPPING</th>
                <th className={TH}>DELIVERY</th>
              </tr>
            </thead>
            <tbody>
              {SHIPPING_REGIONS.map((region) => (
                <tr key={region.id} className="border-b border-foreground/10">
                  <td className="py-2 pr-4">{region.label}</td>
                  <td className="py-2 pr-4 tabular-nums">{formatMoney(region.amount)}</td>
                  <td className="py-2 pr-4 tabular-nums">
                    {region.deliveryDays[0]}–{region.deliveryDays[1]} business days
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p>
          If delivery hasn&apos;t happened within 30 days of your order, or by a date we agreed,
          you can give us a reasonable extra period, and cancel the order for a full refund if we
          miss that too. The risk for the goods passes to you when you receive them.
        </p>
        <p>
          Check your parcel on arrival. If it is visibly damaged, note it with the carrier and
          contact us.
        </p>
      </LegalSection>

      {exports && (
        <LegalSection id="customs" title={`${n("customs")}. DELIVERIES OUTSIDE THE EU`}>
          <p>
            Deliveries to {customsCountries.join(", ")} leave the EU. You are the importer: import
            VAT, any customs duty and the carrier&apos;s handling fee in your country are not
            included in our prices or shipping, and are payable by you, usually to the carrier on
            delivery. If you refuse to pay them and the parcel comes back to us, we refund the
            price of the goods minus the shipping costs we paid in both directions. If you have
            also withdrawn from the purchase under section {n("withdrawal")}, that section applies
            instead: we refund the standard shipping cost too, and deduct only the cost of the
            parcel&apos;s return.
          </p>
        </LegalSection>
      )}

      <LegalSection id="withdrawal" title={`${n("withdrawal")}. RIGHT OF WITHDRAWAL (${WITHDRAWAL_DAYS} DAYS)`}>
        {WITHDRAWAL_PARAGRAPHS.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
        <p>
          <TextLink href={WITHDRAW_PATH}>Withdraw from contract here</TextLink>
        </p>
        <p>
          Returns go to the address in section {n("seller")}. Pack the goods well; they travel at your risk
          until they reach us, so we recommend a tracked service.
        </p>
        <div id="withdrawal-form" className="border-brutal scroll-mt-24 space-y-2 p-5">
          <p className="dossier-label">MODEL WITHDRAWAL FORM</p>
          <p className="opacity-60">
            Complete and return this form only if you wish to withdraw from the contract.
          </p>
          {MODEL_WITHDRAWAL_FORM.map((line) => (
            <p key={line}>{line}</p>
          ))}
        </div>
      </LegalSection>

      <LegalSection id="complaints" title={`${n("complaints")}. FAULTY GOODS AND COMPLAINTS`}>
        <p>
          You have the rights set out in the Swedish Consumer Sales Act (konsumentköplagen), or
          the equivalent law where you live if it gives you more. You can complain about a fault
          for up to {COMPLAINT_YEARS} years after receiving the item. Tell us within a reasonable
          time of discovering the fault; within two months is always in time. A fault that shows up
          within {DEFECT_PRESUMPTION_YEARS} years is presumed to have existed on delivery, unless
          we show otherwise.
        </p>
        <p>
          Email <MailLink /> with your order number, a description and, ideally, photos. For
          justified complaints we pay the return shipping and offer repair or replacement. If
          neither is possible or reasonable, you are entitled to a price reduction or to cancel the
          purchase.
        </p>
        <p>
          Normal wear, damage from misuse, and the natural variation described on a product&apos;s
          page (such as patina on brass or colour variation in hand-cast concrete) are not faults.
        </p>
      </LegalSection>

      <LegalSection id="liability" title={`${n("liability")}. LIABILITY`}>
        <p>
          We are liable for loss we cause through negligence, as Swedish law provides. We are not
          liable for delays or failures caused by events beyond our reasonable control (such as
          strikes, natural disasters or carrier breakdowns). Nothing in these terms limits your
          mandatory rights as a consumer.
        </p>
      </LegalSection>

      <LegalSection id="privacy" title={`${n("privacy")}. PERSONAL DATA`}>
        <p>
          We use your details to deliver your order and keep required accounting records. See
          the <TextLink href="/privacy">privacy policy</TextLink>.
        </p>
      </LegalSection>

      <LegalSection id="disputes" title={`${n("disputes")}. DISPUTES`}>
        <p>
          Contact us first at <MailLink />; we answer within two business days and want to resolve
          it with you. If we can&apos;t agree, you can take the matter to the Swedish National
          Board for Consumer Disputes (Allmänna reklamationsnämnden, ARN), Box 174, 101 23
          Stockholm, <TextLink href="https://www.arn.se">arn.se</TextLink>. We take part in ARN
          proceedings and follow its recommendations.
        </p>
        <p>
          If you live in another EU country, Norway or Iceland, the European Consumer Centre in
          your country can help for free (<TextLink href="https://www.eccnet.eu">eccnet.eu</TextLink>).
        </p>
        <p>
          These terms are governed by Swedish law. If you live outside Sweden, you keep the
          protection of the mandatory consumer rules of your country of residence, and you can
          bring a claim in its courts.
        </p>
      </LegalSection>
    </LegalDoc>
  );
}
