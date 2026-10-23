# Store emails: what the law requires, what we send, what to build

Researched 2026-10-23. This is a reading of the rules for planning; it is not legal advice. Have anything marked **CHECK** confirmed by an accountant or lawyer.

## 1. What the law requires (Swedish/EU web shop selling goods to consumers)

| Rule | What it requires | Email it affects |
|---|---|---|
| Lag (2002:562) om elektronisk handel, **12 §** | Confirm **receipt of an order** electronically, without undue delay. Cannot be contracted away with consumers (14 §). | Order confirmation |
| Distansavtalslagen (2005:59) **2 kap. 4 §** (CRD art. 8(7)) | Confirm the **contract** on a durable medium (email counts) within a reasonable time, **at the latest at delivery**. It must contain the pre-contract information (2 kap. 2 §) not already given on a durable medium: seller identity and address, goods, total price incl. VAT and delivery cost, payment and delivery terms, the **right of withdrawal** (conditions, deadline, procedure) with the **model withdrawal form**, who pays return shipping, the legal guarantee (reklamationsrätt), and complaint/dispute handling. | Order confirmation |
| CRD art. 11(3) | If the site offers an online withdrawal form, send an **acknowledgement of receipt on a durable medium without delay**. | Withdrawal acknowledgement |
| Directive (EU) 2023/2673, **CRD art. 11a** (Sweden: prop. 2025/26:84), **applies from 19 June 2026** | An online **withdrawal function** ("withdraw from contract here" / "ångra avtalet här"), clearly labelled, **easily accessible** on the site where the contract was made, **for the whole withdrawal period**. After use, a confirmation **without delay** that shows **what was received and when** (date and time), on a durable medium. | Withdrawal acknowledgement + where the link is shown |
| Distansavtalslagen 2 kap. 14 § | Refund everything paid (incl. standard shipping) within 14 days of the withdrawal notice; it may be held until the goods are back or proof of return is shown. **No law requires a refund email**, but the refund must happen and be provable. | Refund email (recommended, not required) |
| Marknadsföringslagen (2008:486) | Marketing by email to private persons needs consent, except to existing customers for similar own products with an easy opt-out in every message. **Order, shipping and refund emails are not marketing** as long as they contain no promotion. | All: keep transactional emails free of promotion |
| GDPR | Transactional emails rest on performing the contract. Keep only the data needed. The privacy policy already covers order data. | All |
| Bookkeeping/VAT | A B2C web sale paid by card needs no invoice by default. Showing the VAT amount is good practice and helps the customer. **CHECK** with the accountant whether anything else must appear (e.g. for OSS sales to other EU countries). | Order confirmation, refund email |

Nothing requires a **shipped** email.

## 2. What we send today

| Email | Status | Notes |
|---|---|---|
| **Order confirmation** (customer) + `[NEW ORDER]` copy to desk@ | ✅ Sent by the webhook after payment (`src/lib/order-email.ts`, `src/lib/mail.ts`) | Covers every legal point in section 1: order ref, lines, shipping, total, VAT, delivery address, dispatch time, seller identity with org.nr and VAT no., withdrawal right, model form, faulty goods (3 years), disputes (ARN), terms version and link. **Plain text only.** |
| **Withdrawal acknowledgement** (customer) + `[WITHDRAWAL]` copy | ✅ Sent by `/store/withdraw` (`src/lib/withdrawal-email.ts`) | Meets art. 11(3)/11a: order, name, email, **received date and time (Swedish time)**, next steps, seller. Capped at 20/hour (P1-07). Plain text. |
| **Shipped** | ❌ None | Not required. |
| **Refund** | ❌ None. Stripe's own receipts are off, which is correct: otherwise customers get two systems' emails. | Not required, but a customer who withdrew expects to hear back. |
| `[OVERSOLD]` / `[WEBHOOK FAILED]` | ✅ Internal alerts to desk@ | Internal only; stay plain text. |

**Gap found, not an email:** the withdrawal function (`/store/withdraw`) is linked only from `/terms` and from inside the emails. Art. 11a asks for it to be **easily accessible** for the whole withdrawal period. Add a permanent "Withdraw from contract here" link in the site footer (or the store's footer area). This is a small change and the most important legal item in this document.

## 3. Recommendation

1. **Footer link to the withdrawal function** (legal, small).
2. **Branded HTML for the customer emails**: order confirmation, shipped, refund and withdrawal acknowledgement. Every email keeps a **plain-text part** with the same content: it is what spam filters and many clients read, and it stays the legal "durable medium" version. Internal emails to desk@ stay plain text.
3. **Shipped email** when an order is marked shipped in the admin, with an **optional carrier and tracking number**. It is not required, but it is the one customers notice when it's missing, and it cuts "where is my order?" emails.
4. **Refund email** when Stripe reports a refund: the amount, full or partial, the order ref, and "it can take 5–10 business days to show on your statement".
5. No marketing in any of them, not even a "you might also like". The newsletter stays opt-in and separate.

### Design rules for the HTML (match kansliet.co)
Taken from `src/app/globals.css`. The owner's direction: simple, curated, "dossier", nothing extra.

- **Two colours only:** paper `#e9e7e2` as the background and signal `#2f3133` for text, rules and chips. Secondary text uses the same signal colour at `opacity: 0.6`. No accent colours, no images, no logo file: the wordmark is a label chip.
- **Font:** Martian Mono (the site's font), loaded from Google Fonts in `<head>`, with the fallback `ui-monospace, Menlo, Consolas, 'Courier New', monospace` for clients that block web fonts (Gmail, Outlook).
- **Sizes:** body 12 px, labels/legal 11 px, footer 10 px, title and total 20 px light (300). Slightly larger than the site's 11 px base, for phones.
- **The dossier label** (`.dossier-label`): a signal-coloured chip with paper-coloured UPPERCASE text, `letter-spacing: 0.05em`, `padding: 2px 5px`. Used for the masthead wordmark `KANSLIET (STORE)`, `TOTAL PAID`, `DELIVERY TO` and `SELLER`. Nowhere else.
- **Rules:** 1 px solid signal ("brutal"). One under the masthead, one box around the order lines (like the cart), and one above each legal section. No rounded corners, no shadows.
- **Layout:**
  - Masthead: label chip left, order ref right.
  - Title "ORDER CONFIRMED" and the date line.
  - Bordered order box: lines, shipping, then the TOTAL PAID chip with a large total. The VAT line sits under the box.
  - DELIVERY TO | SELLER in two columns.
  - Legal sections (withdrawal, model form, faulty goods, disputes) in 11 px.
  - **One outlined button: "CANCEL OR RETURN A PURCHASE →"**, the only call to action. This is the owner's softer label (2026-10-23), replacing "withdraw from contract here".
  - Footer links: terms (with version), privacy, kansliet.co.
- **Shipped / refund / withdrawal emails** use the same masthead, title, one bordered box (tracking, refund amount, or received date and time) and footer, with only their own legal lines.
- **Technical:**
  - Table layout and inline styles. One `<style>` block, only for mobile padding.
  - `<meta name="color-scheme" content="light">`, so clients keep the paper colour where they allow it.
  - A hidden preheader line.
  - 600 px max width.
  - **No tracking pixels.**
- **Approved by the owner on 2026-10-23 for all customer emails** (order confirmation, withdrawal acknowledgement, shipped, refund).
- Previews: [`email-previews/`](email-previews/) holds `order-confirmation`, `withdrawal-received`, `shipped` and `refund`, rendered by the real builders from fixed test data. Regenerate them with `WRITE_EMAIL_PREVIEWS=1 npx vitest run src/lib/email-previews.test.ts` (`src/lib/email-previews.test.ts`). The 2026-10-23 hard-coded mockup of the order confirmation was the design reference; the generated file replaces it.
- One shared `renderEmail({ preheader, sections })` that builds **both** HTML and text from the same content, so the two can never disagree. The legal text keeps coming from `legal-text.ts` / `shop-info.ts`, as today.
- Test in Gmail (web and app), Apple Mail, Outlook web and dark mode before switching on.

## 4. Task cards (for implementation)

### E-01 · Withdrawal link on every store page · legal · S

> **Changed 2026-10-23 (owner's call):** the line is now on the **success page only**, labelled **"CANCEL OR RETURN A PURCHASE →"**. It was removed from `/store`, product pages and the cart; emails and `/terms` keep their links. This is a deliberate grey zone under art. 11a (see README, Withdrawals). The card below describes the original version.
- **Status: done on branch `store/emails`, merged (#19).**
- **Files:** `src/components/store/withdraw-link.tsx` (new), the four store pages under `src/app/(main)/store/(shop)/`, `docs/store/README.md`. The site has no footer (the frame is the AxisNav tabs), so the link is a small line at the end of the page content, in the store only.
- **Change:**
  1. A line **"WITHDRAW FROM CONTRACT HERE →"** (small caps, 1 px top rule) linking to `WITHDRAW_PATH`, at the end of `/store`, every product page, `/store/cart` and `/store/success`.
  2. Not on portfolio pages, not in the INDEX panel, no fixed element, no new footer. (Owner's decision 2026-10-23.)
  3. Keep the existing `/terms` link.
- **Accept:** the link is visible at the end of `/store`, a product page, the cart and the success page, and `/terms` still links to the form. Typecheck, lint and tests pass.

### E-02 · Shared email renderer (HTML + text) · M
- **Status: done on branch `store/emails`, merged (#19).**
- **Files:** new `src/lib/email-layout.ts` + test; `src/lib/mail.ts` (pass `html` alongside `text` to Resend for customer emails). No image assets: the wordmark is a text chip.
- **Change:**
  1. `renderEmail({ subject, preheader, blocks })` returns `{ subject, html, text }`. Blocks are headings, key/value rows, paragraphs and order lines.
  2. Escape all customer-supplied strings in the HTML.
  3. `sendCustomerEmail` sends both parts. The desk@ copy stays text.
- **Accept:** unit tests show that every block appears in both html and text, that HTML escaping works (`<script>` in a name), and that no external resources load except the Google Fonts stylesheet.

### E-03 · Order confirmation and withdrawal acknowledgement use the renderer · M
- **Status: done on branch `store/emails`, merged (#19).**
- **Files:** `src/lib/order-email.ts`, `src/lib/withdrawal-email.ts`, their tests.
- **Change:**
  1. Rebuild both from blocks.
  2. **The text part must keep every legal element listed in section 2** (the existing tests should keep passing with minimal edits).
  3. Wording stays the same unless the owner changes it.
- **Accept:** existing tests pass, plus a test that the HTML contains the withdrawal section, the model form, the seller's org.nr and the received date/time.

### E-04 · Shipped email with optional tracking · M (migration)
- **Status: done on branch `store/emails`, merged (#19).**
- **Files:**
  - new migration `ALTER TABLE shop_orders ADD COLUMN IF NOT EXISTS carrier text, ADD COLUMN IF NOT EXISTS tracking_number text` (`shipped_at` already exists from P2-04, migration `2026-10-26-order-status.sql`)
  - `db/schema.sql`
  - `src/app/(main)/admin/orders/actions.ts`
  - `src/app/(main)/admin/orders/page.tsx`
  - new `src/lib/shipped-email.ts` + test
- **Change:**
  1. **MARK SHIPPED** gets two optional fields: carrier (select: PostNord, DHL, Budbee, Other) and tracking number.
  2. On success it sets `shipped_at` and sends the shipped email: order ref, items, carrier, tracking number with the carrier's tracking link when known, and the withdrawal reminder ("14 days from when you receive it", with the link).
  3. A failure to send is logged and shown, but never undoes the shipped mark.
  4. Build on P2-04's `markShipped`, which only moves `paid` to `shipped` and sets `shipped_at`. Send the email only when that UPDATE changed a row, so a double click doesn't send twice.
- **Accept:** tests for the email builder. Marking shipped without tracking still works.
- **Owner actions:** run `db/migrations/2026-10-27-shipping-tracking.sql` on Neon `main` before merging.

### E-05 · Refund email · S–M
- **Status: done on branch `store/emails`, merged (#19).**
- **Files:** `src/app/api/store/webhook/route.ts` (`recordRefund`), new `src/lib/refund-email.ts` + test.
- **Change:**
  1. After COMMIT, when `recordRefund` recorded a new refund amount, send: order ref, the amount refunded **this time** and the total refunded, full or partial, the payment method ("to the card you paid with"), and "5–10 business days".
  2. Use the order's currency (the P1-05 helper).
  3. Send nothing for events that changed nothing (redeliveries).
- **Accept:** tests for full, partial and second-partial refunds. No email when `refunded <= order.amount_refunded`.

### E-06 · Owner review before switching on · S
- Send every template to desk@ from a local run.
- Check them in Gmail, Apple Mail, Outlook and dark mode.
- Adjust the wording.
- Only then merge.

Order: **E-01 first** (legal). Then E-02 → E-03 → E-05 → E-04. Start only after the Phase 2 PR is merged into `main`, since E-04 builds on P2-04.

## Sources
- [Lag (2002:562) om elektronisk handel](https://data.riksdagen.se/dokument/sfs-2002-562.html), §§ 9–12, 14
- [Distansavtalslagen (2005:59) on lagen.nu](https://lagen.nu/2005:59/konsolidering/2014:221), 2 kap. 2, 4, 10, 12, 14 §§ (older consolidation; check the current text on riksdagen.se)
- [Directive 2011/83/EU, art. 11](https://www.legislation.gov.uk/eudr/2011/83/article/11)
- [CMS: Ny "ångerknapp" krävs från den 19 juni 2026](https://cms.law/sv/swe/legal-updates/ny-aangerknapp-kraevs-paa-e-handelsplattformar-fraan-den-19-juni-2026)
- [Prop. 2025/26:84, Ett stärkt konsumentskydd vid distansavtal](https://regeringen.se/rattsliga-dokument/proposition/2025/12/prop.-20252684)
- [Konsumentverket, standard template for withdrawal information](https://cdn.abicart.com/shop/ws13/51213/files/standardmall-information-om-angerratten-2022-konsumentverket%20%281%29-2.pdf)
- [Marknadsföringslagen (2008:486)](https://government.se/contentassets/747603b3d1a04351b1773524c7de3c84/2008486-marketing-act)
- [Lawline: Ångerrätt och återbetalning vid distansköp](https://lawline.se/answers/angerratt-och-aterbetalning-vid-distanskop)
