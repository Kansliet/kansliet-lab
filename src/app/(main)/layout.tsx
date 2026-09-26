import { AxisNav } from "@/components/axis-nav";
import { TransitionWrapper } from "@/components/transition-wrapper";
import { MainLayoutShell } from "@/components/main-layout-shell";
import { ScrollRail } from "@/components/scroll-rail";

/**
 * No header, no footer: the frame is AxisNav's two tabs on one horizontal
 * axis, and its index panel holds sections, legal pages and company details.
 */
export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <MainLayoutShell>
      <AxisNav />
      <ScrollRail />
      {/* Phones: room below the content for the bottom-edge axis tabs. */}
      <main id="main-content" className="flex-1 flex flex-col w-full min-h-0 max-lg:pb-12">
        <TransitionWrapper>{children}</TransitionWrapper>
      </main>
    </MainLayoutShell>
  );
}
