import { COMPANY, TERMS_VERSION } from "@/lib/shop-info";

// One renderer for every customer email: the same blocks produce the HTML and
// the plain-text part, so the two can never disagree about what the email says.
// The text part is also the legal "durable medium" version and what spam
// filters read, so nothing may exist in one part and not the other.
//
// Look (docs/store/EMAILS.md, "Design rules for the HTML"): paper background,
// one signal colour, Martian Mono with a monospace fallback, label chips,
// 1 px rules, table layout with inline styles, no images, no tracking.

const PAPER = "#e9e7e2";
const SIGNAL = "#2f3133";
const FONT = "'Martian Mono', ui-monospace, Menlo, Consolas, 'Courier New', monospace";
const FONTS_URL =
  "https://fonts.googleapis.com/css2?family=Martian+Mono:wght@300;400&display=swap";

/** A line of text, or a line that is a link. */
export type Line = string | { text: string; href: string };

export type BoxRow =
  /** An order line: text left, amount right. */
  | { kind: "item"; text: string; amount?: string }
  /** A quieter line (shipping). */
  | { kind: "muted"; text: string; amount?: string }
  /** A key/value row: "Order", "Received". `href` makes the value a link. */
  | { kind: "kv"; label: string; value: string; href?: string }
  /** The label chip and the large amount. */
  | { kind: "total"; label: string; amount: string };

export type EmailBlock =
  | { type: "title"; title: string; subtitle?: string }
  | { type: "paragraph"; text: string; muted?: boolean }
  /** The one bordered box. `notes` sit just under it (VAT line, charged currency). */
  | { type: "box"; rows: BoxRow[]; notes?: string[] }
  /** One or two label-chip columns (DELIVERY TO | SELLER). */
  | { type: "columns"; columns: { chip: string; lines: Line[]; note?: string }[] }
  /** A legal section under a rule. `paragraphs` are separated by a blank line, `lines` are not. */
  | {
      type: "section";
      heading: string;
      paragraphs?: string[];
      lines?: string[];
      subdued?: boolean;
      button?: { label: string; href: string };
    }
  | {
      type: "footer";
      links: { label: string; href: string; note?: string; textLabel?: string }[];
    };

export type EmailContent = {
  subject: string;
  /** The line inbox lists show after the subject; hidden in the body. */
  preheader: string;
  /** The order reference, shown right of the wordmark. */
  reference?: string;
  blocks: EmailBlock[];
};

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Only https and mailto links are ever written into the HTML. */
function safeHref(href: string): string {
  if (!/^(https:\/\/|mailto:)/i.test(href)) throw new Error(`Unsafe email link: ${href}`);
  return escapeHtml(href);
}

// ---------------------------------------------------------------- text part

function lineText(line: Line): string {
  if (typeof line === "string") return line;
  return line.href.startsWith("mailto:") ? line.text : `${line.text} (${line.href})`;
}

function rowText(row: BoxRow): string {
  switch (row.kind) {
    case "item":
    case "muted":
      return row.amount ? `${row.text}  ${row.amount}` : row.text;
    case "kv":
      return row.href && !row.href.startsWith("mailto:")
        ? `${row.label}: ${row.value} (${row.href})`
        : `${row.label}: ${row.value}`;
    case "total":
      return `${row.label.toUpperCase()}  ${row.amount}`;
  }
}

function blockText(block: EmailBlock): string[] {
  switch (block.type) {
    case "title":
      return [block.title.toUpperCase(), ...(block.subtitle ? [block.subtitle] : [])];
    case "paragraph":
      return [block.text];
    case "box":
      return [...block.rows.map(rowText), ...(block.notes ?? [])];
    case "columns":
      return block.columns.flatMap((column, index) => [
        ...(index > 0 ? [""] : []),
        column.chip.toUpperCase(),
        ...column.lines.map(lineText),
        ...(column.note ? [column.note] : []),
      ]);
    case "section":
      return [
        block.heading.toUpperCase(),
        ...(block.paragraphs ?? []).flatMap((p, index) => [...(index > 0 ? [""] : []), p]),
        ...(block.lines ?? []),
        ...(block.button ? ["", `${block.button.label}: ${block.button.href}`] : []),
      ];
    case "footer":
      return block.links.map(
        (link) =>
          `${link.textLabel ?? link.label}${link.note ? ` ${link.note}` : ""}: ${link.href}`,
      );
  }
}

function renderText(content: EmailContent): string {
  const masthead = ["KANSLIET (STORE)", content.reference].filter(Boolean).join(" · ");
  return [masthead, ...content.blocks.map((block) => blockText(block).join("\n"))].join("\n\n");
}

// ---------------------------------------------------------------- html part

const SMALL_CAPS = "font-size:11px; letter-spacing:0.05em; text-transform:uppercase;";
const MUTED = "opacity:0.6;";
const PX = 'class="px"';
const CELL = `padding:0 32px;`;

function chip(label: string, size = "font-size:11px;"): string {
  return `<span style="background:${SIGNAL}; color:${PAPER}; ${size} letter-spacing:0.05em; text-transform:uppercase; padding:2px 5px;">${escapeHtml(label)}</span>`;
}

function link(text: string, href: string, style = `color:${SIGNAL};`): string {
  return `<a href="${safeHref(href)}" style="${style}">${escapeHtml(text)}</a>`;
}

function lineHtml(line: Line): string {
  return typeof line === "string" ? escapeHtml(line) : link(line.text, line.href);
}

function rowHtml(row: BoxRow, first: boolean): string {
  const border = first ? "" : `border-top:1px solid ${SIGNAL};`;
  const amount = (value: string | undefined, extra = "") =>
    value === undefined
      ? ""
      : `<td align="right" style="padding:14px 16px; ${border} white-space:nowrap; ${extra}">${escapeHtml(value)}</td>`;
  switch (row.kind) {
    case "item":
      return `<tr><td style="padding:14px 16px; ${border} text-transform:uppercase; letter-spacing:0.05em;"${row.amount === undefined ? ' colspan="2"' : ""}>${escapeHtml(row.text)}</td>${amount(row.amount)}</tr>`;
    case "muted":
      return `<tr><td style="padding:10px 16px; ${border} ${SMALL_CAPS} ${MUTED}"${row.amount === undefined ? ' colspan="2"' : ""}>${escapeHtml(row.text)}</td>${amount(row.amount, "padding:10px 16px;")}</tr>`;
    case "kv":
      return `<tr><td valign="top" style="padding:10px 16px; ${border} ${SMALL_CAPS} ${MUTED}">${escapeHtml(row.label)}</td><td align="right" style="padding:10px 16px; ${border} word-break:break-word;">${row.href ? link(row.value, row.href) : escapeHtml(row.value)}</td></tr>`;
    case "total":
      return `<tr><td style="padding:14px 16px; ${border}">${chip(row.label)}</td><td align="right" style="padding:14px 16px; ${border} font-size:20px; font-weight:300; white-space:nowrap;">${escapeHtml(row.amount)}</td></tr>`;
  }
}

function blockHtml(block: EmailBlock, last: boolean): string {
  switch (block.type) {
    case "title":
      return `<tr><td ${PX} style="padding:36px 32px ${block.subtitle ? "6px" : "28px"}; font-size:20px; font-weight:300; letter-spacing:0.05em; text-transform:uppercase;">${escapeHtml(block.title)}</td></tr>${
        block.subtitle
          ? `\n<tr><td ${PX} style="padding:0 32px 28px; ${SMALL_CAPS} ${MUTED}">${escapeHtml(block.subtitle)}</td></tr>`
          : ""
      }`;
    case "paragraph":
      return `<tr><td ${PX} style="padding:0 32px 24px; ${block.muted ? `font-size:11px; ${MUTED}` : ""}">${escapeHtml(block.text)}</td></tr>`;
    case "box":
      return `<tr><td ${PX} style="${CELL}">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid ${SIGNAL};">
${block.rows.map((row, i) => rowHtml(row, i === 0)).join("\n")}
</table>${(block.notes ?? [])
        .map((note) => `\n<div style="padding:8px 0 0; font-size:11px; ${MUTED}">${escapeHtml(note)}</div>`)
        .join("")}
</td></tr>`;
    case "columns": {
      const width = Math.floor(100 / block.columns.length);
      const cells = block.columns
        .map((column, i) => {
          const pad =
            block.columns.length === 1
              ? ""
              : i === 0
                ? "padding-right:12px;"
                : "padding-left:12px;";
          return `<td valign="top" width="${width}%" style="${pad}">
${chip(column.chip)}
<div style="padding-top:10px;">${column.lines.map(lineHtml).join("<br>")}</div>${
            column.note
              ? `\n<div style="padding-top:8px; font-size:11px; ${MUTED}">${escapeHtml(column.note)}</div>`
              : ""
          }
</td>`;
        })
        .join("\n");
      return `<tr><td ${PX} style="padding:32px 32px 0;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
${cells}
</tr></table>
</td></tr>`;
    }
    case "section": {
      const body = [
        block.paragraphs?.map(escapeHtml).join("<br><br>"),
        block.lines?.map(escapeHtml).join("<br>"),
      ]
        .filter(Boolean)
        .join("<br><br>");
      return `<tr><td ${PX} style="padding:28px 32px 0;">
<div style="border-top:1px solid ${SIGNAL}; padding-top:14px; ${SMALL_CAPS}">${escapeHtml(block.heading)}</div>
<div style="padding-top:8px; font-size:11px; line-height:1.7;${block.subdued ? " opacity:0.8;" : ""}">${body}</div>${
        block.button
          ? `
<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin-top:14px;"><tr>
<td style="border:1px solid ${SIGNAL}; padding:8px 12px; ${SMALL_CAPS}">${link(`${block.button.label} →`, block.button.href, `color:${SIGNAL}; text-decoration:none;`)}</td>
</tr></table>`
          : ""
      }
</td></tr>`;
    }
    case "footer":
      return `<tr><td ${PX} style="padding:${last ? "40px" : "28px"} 32px 0;">
<div style="border-top:1px solid ${SIGNAL}; padding-top:14px; font-size:10px; letter-spacing:0.05em; text-transform:uppercase; ${MUTED}">
${block.links
  .map((l) => `${link(l.label, l.href)}${l.note ? ` ${escapeHtml(l.note)}` : ""}`)
  .join(" ·\n")}
</div>
</td></tr>`;
  }
}

function renderHtml(content: EmailContent): string {
  const reference = content.reference
    ? `<td align="right" style="${SMALL_CAPS} ${MUTED}">${escapeHtml(content.reference)}</td>`
    : "";
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light">
<meta name="supported-color-schemes" content="light">
<title>${escapeHtml(content.subject)}</title>
<link href="${FONTS_URL}" rel="stylesheet">
<style>
  @media (max-width: 620px) {
    .px { padding-left: 16px !important; padding-right: 16px !important; }
  }
</style>
</head>
<body style="margin:0; padding:0; background:${PAPER}; color:${SIGNAL}; -webkit-text-size-adjust:100%;">
<div style="display:none; max-height:0; overflow:hidden; mso-hide:all;">${escapeHtml(content.preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${PAPER};">
<tr><td align="center" style="padding:32px 0;">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%; max-width:600px; font-family:${FONT}; font-size:12px; line-height:1.6; color:${SIGNAL};">
<tr><td ${PX} style="padding:0 32px 14px; border-bottom:1px solid ${SIGNAL};">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
<td style="${SMALL_CAPS}">${chip("KANSLIET (STORE)", "")}</td>
${reference}
</tr></table>
</td></tr>
${content.blocks.map((block, i) => blockHtml(block, i === content.blocks.length - 1)).join("\n")}
</table>
</td></tr>
</table>
</body>
</html>
`;
}

export function renderEmail(content: EmailContent): { subject: string; html: string; text: string } {
  return { subject: content.subject, html: renderHtml(content), text: renderText(content) };
}

// ------------------------------------------------- blocks shared by emails

/** The standard footer: terms (with version), privacy, the website. */
export function footerBlock(): EmailBlock {
  return {
    type: "footer",
    links: [
      {
        label: "Terms of sale",
        textLabel: "Full terms of sale",
        note: `(version ${TERMS_VERSION})`,
        href: `https://${COMPANY.website}/terms`,
      },
      { label: "Privacy policy", href: `https://${COMPANY.website}/privacy` },
      { label: COMPANY.website, href: `https://${COMPANY.website}` },
    ],
  };
}

/** The SELLER column: identity, address, contact, org.nr and VAT no. */
export function sellerColumn(): { chip: string; lines: Line[]; note: string } {
  const [street, ...rest] = COMPANY.address;
  return {
    chip: "Seller",
    lines: [
      COMPANY.legalName,
      street,
      rest.join(", "),
      { text: COMPANY.email, href: `mailto:${COMPANY.email}` },
      COMPANY.phone.display,
    ],
    note: `Org.nr ${COMPANY.orgNr} · VAT ${COMPANY.vatNr}`,
  };
}
