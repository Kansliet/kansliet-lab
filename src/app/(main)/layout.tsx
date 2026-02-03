import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { TransitionWrapper } from "@/components/transition-wrapper";
import { MainLayoutShell } from "@/components/main-layout-shell";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <MainLayoutShell>
        <Header />
        {/* On project pages, main fills the rest of the viewport (dossier + this shell = one window) */}
        <main id="main-content" className="flex-1 flex flex-col w-full min-h-0">
          <TransitionWrapper>{children}</TransitionWrapper>
        </main>
      </MainLayoutShell>
      {/* Footer is outside the shell so on project pages it sits below the fold — scroll to reveal */}
      <Footer />
    </>
  );
}
