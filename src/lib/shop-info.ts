// Everything the store's legal pages, cart, checkout and order email say about
// the seller, shipping and consumer rights comes from here, so a change (a new
// rate, a dropped country, a moved office) is made once and shows everywhere.
// Pure data, no server imports: client components may use it.

export const COMPANY = {
  tradingName: "Kansliet",
  /** Always written in capitals. */
  legalName: "KANSLIET STUDIO AB",
  orgNr: "559581-6033",
  /** Swedish VAT numbers are SE + org.nr + 01. */
  vatNr: "SE559581603301",
  /** Geographic address, required by e-handelslagen 8 §. */
  address: ["Allévägen 30C", "311 45 Falkenberg", "Sweden"],
  email: "desk@kansliet.co",
  /** Listed in the seller details: the law requires a phone number the company has. */
  phone: { display: "+46 70 829 13 00", href: "tel:+46708291300" },
  website: "kansliet.co",
} as const;

export const VAT_RATE_PERCENT = 25;

export type ShippingRegion = {
  id: string;
  label: string;
  /** ISO 3166-1 alpha-2, as Stripe expects. */
  countries: readonly string[];
  /** Öre (SEK × 100), VAT included. */
  amount: number;
  /** Goods subtotal (öre, VAT included) from which shipping is free; unset = never free. */
  freeFrom?: number;
  /** Business days from dispatch. */
  deliveryDays: readonly [min: number, max: number];
  /** Outside the EU VAT area: customer is the importer and pays duties/import VAT. */
  customs: boolean;
  /** Off = not offered anywhere (cart, checkout, terms). */
  enabled: boolean;
};

const ALL_SHIPPING_REGIONS: readonly ShippingRegion[] = [
  { id: "se", label: "Sweden", countries: ["SE"], amount: 5900, freeFrom: 80000, deliveryDays: [1, 3], customs: false, enabled: true },
  { id: "eu", label: "EU (Denmark, Finland, Germany)", countries: ["DK", "FI", "DE"], amount: 11900, deliveryDays: [3, 7], customs: false, enabled: true },
  // Norway: fine without registration while sales there stay under NOK 50,000
  // a year; above that, register for VOEC and collect Norwegian VAT at checkout.
  { id: "no", label: "Norway", countries: ["NO"], amount: 14900, deliveryDays: [3, 8], customs: true, enabled: true },
  // Paused: the UK requires foreign sellers to register for UK VAT and charge
  // it on orders up to £135 from the first sale. Enable after HMRC registration
  // (and rewrite terms section 6 for UK VAT charged at checkout).
  { id: "gb", label: "United Kingdom", countries: ["GB"], amount: 14900, deliveryDays: [4, 10], customs: true, enabled: false },
  // Paused: US de minimis is suspended and PostNord ships to the US only with
  // duties prepaid by the sender (PDDP). Enable once the rate covers tariffs.
  { id: "us", label: "United States", countries: ["US"], amount: 24900, deliveryDays: [5, 12], customs: true, enabled: false },
];

/** The regions the store actually ships to. */
export const SHIPPING_REGIONS = ALL_SHIPPING_REGIONS.filter((region) => region.enabled);

export const COUNTRY_NAMES: Record<string, string> = {
  SE: "Sweden",
  DK: "Denmark",
  FI: "Finland",
  DE: "Germany",
  NO: "Norway",
  GB: "United Kingdom",
  US: "United States",
};

export const SHIP_COUNTRIES = SHIPPING_REGIONS.flatMap((region) => region.countries);

export function regionForCountry(country: string): ShippingRegion | null {
  return SHIPPING_REGIONS.find((region) => region.countries.includes(country)) ?? null;
}

/** Shipping for a goods subtotal (öre): free at or above the region's threshold. */
export function shippingCost(region: ShippingRegion, subtotalCents: number): number {
  return region.freeFrom !== undefined && subtotalCents >= region.freeFrom ? 0 : region.amount;
}

/** Business days from order to dispatch. */
export const DISPATCH_DAYS = 2;
/** Ångerrätt: days from receipt of the goods (distansavtalslagen 2 kap 10 §). */
export const WITHDRAWAL_DAYS = 14;
/** Refund deadline after a withdrawal notice (2 kap 14 §). */
export const REFUND_DAYS = 14;
/**
 * The online withdrawal function ("ångerknapp", EU directive 2023/2673,
 * art. 11a CRD; 2 kap. 10 a § distansavtalslagen): linked from the terms
 * (section on withdrawal) and every order confirmation.
 */
export const WITHDRAW_PATH = "/store/withdraw";
/** Reklamationsrätt: years from receipt (konsumentköplagen 5 kap). */
export const COMPLAINT_YEARS = 3;
/** Defects appearing within this many years are presumed to have existed at delivery. */
export const DEFECT_PRESUMPTION_YEARS = 2;

export const TERMS_VERSION = "2026-09-27";

/** Stripe currency code for every price, shipping rate and payout. */
export const STORE_CURRENCY = "sek";

/**
 * 45000 → "450 kr" (decimals only when there are öre). Other currencies, such
 * as what a customer was charged via Stripe Adaptive Pricing, as "€47.20".
 */
export function formatMoney(cents: number, currency: string = STORE_CURRENCY): string {
  const code = currency.toUpperCase();
  const amount = cents / 100;
  const fraction = Number.isInteger(amount) ? 0 : 2;
  return new Intl.NumberFormat(code === "SEK" ? "sv-SE" : "en-US", {
    style: "currency",
    currency: code,
    minimumFractionDigits: fraction,
    maximumFractionDigits: fraction,
  }).format(amount);
}
