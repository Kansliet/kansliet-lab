/**
 * The site's scrollbar: a thin marker on the right edge that tracks scroll
 * position (styles in globals.css). "page" follows the document; "pane"
 * follows the nearest .scroll-pane under a shared .scroll-pane-scope.
 */
export function ScrollRail({ source = "page" }: { source?: "page" | "pane" }) {
  return (
    <div aria-hidden className="scroll-rail print:hidden" data-source={source}>
      <span />
    </div>
  );
}
