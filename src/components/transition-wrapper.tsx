/**
 * Wraps the routed page content. The page transition is handled at the root
 * level in globals.css (::view-transition-*), so no per-route
 * view-transition-name is needed here — which keeps this a plain server
 * component (no usePathname, no client boundary).
 */
export function TransitionWrapper({ children }: { children: React.ReactNode }) {
  return <div className="flex-1 flex flex-col w-full min-h-0">{children}</div>;
}
