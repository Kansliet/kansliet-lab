import { Header } from "@/components/header";
import { Footer } from "@/components/footer";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // 1. min-h-screen ensures the footer is at the bottom even on empty pages
    <div className="flex min-h-screen flex-col bg-background">
      <Header />

      {/* 2. flex-1 pushes the footer down, but allows full height expansion */}
      <main className="flex-1 flex flex-col w-full">{children}</main>

      {/* 3. Footer is now just a block at the end of the document flow */}
      <Footer />
    </div>
  );
}
