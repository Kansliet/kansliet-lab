/**
 * Wraps the routed page content. Navigation is an instant cut (no page
 * transition), like turning to the next sheet of a dossier.
 */
export function TransitionWrapper({ children }: { children: React.ReactNode }) {
  return <div className="flex-1 flex flex-col w-full min-h-0">{children}</div>;
}
