import { Link } from "next-view-transitions";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Page Not Found",
  description: "The page you are looking for does not exist or has been moved.",
};

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="container-kansliet text-center">
        <h1 className="text-caps text-5xl font-light mb-6">
          404
          <br />
          NOT FOUND
        </h1>
        <p className="text-normal-case text-base font-light opacity-60 mb-8 max-w-md mx-auto">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <Link
          href="/"
          scroll={false}
          className="text-caps inline-flex items-center justify-center text-sm font-light tracking-wide transition-opacity border-brutal bg-foreground text-background hover:opacity-80 px-8 py-3 disabled:pointer-events-none disabled:opacity-50"
        >
          RETURN HOME
        </Link>
      </div>
    </div>
  );
}
