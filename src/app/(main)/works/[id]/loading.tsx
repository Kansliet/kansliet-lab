import Image from "next/image";

/**
 * Matches the project page layout (aside + content) so there’s no layout shift.
 * Uses the same rotating logo as the root loading so it’s clearly “loading”, not empty.
 */
export default function ProjectLoading() {
  return (
    <div className="flex-1 bg-background flex flex-col lg:flex-row min-h-0 w-full relative">
      {/* Left: same aspect as project carousel, rotating logo */}
      <aside className="w-full lg:w-1/2 shrink-0 aspect-4/5 lg:sticky lg:top-0 lg:self-start flex items-center justify-center bg-foreground/5 border-brutal lg:border-r-0 lg:border-b-0">
        <div className="text-center">
          <Image
            src="/kansliet-logo-footer_1.svg"
            alt=""
            width={40}
            height={40}
            className="w-10 h-10 animate-spin-slow block mx-auto mb-4"
          />
          <p className="text-caps text-sm font-light tracking-wider">
            LOADING
          </p>
        </div>
      </aside>

      {/* Right: skeleton matching project content */}
      <div className="flex-1 flex flex-col min-w-0 py-10 lg:py-20 min-h-0">
        <div className="container-kansliet flex flex-col">
          <div className="flex flex-col gap-6 lg:gap-8 mb-10 lg:mb-20">
            <div className="h-4 w-24 bg-foreground/10 animate-pulse" />
            <div className="flex flex-col lg:flex-row lg:items-baseline lg:justify-between gap-6">
              <div className="h-10 w-48 bg-foreground/10 animate-pulse" />
              <div className="h-4 w-32 bg-foreground/10 animate-pulse" />
            </div>
          </div>
          <div className="border-b-brutal pb-8 lg:pb-10 mb-8 lg:mb-10">
            <div className="h-4 w-20 bg-foreground/10 animate-pulse" />
          </div>
          <div className="space-y-4">
            <div className="h-4 w-full max-w-md bg-foreground/10 animate-pulse" />
            <div className="h-4 w-full max-w-md bg-foreground/10 animate-pulse" />
            <div className="h-4 w-2/3 max-w-md bg-foreground/10 animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
}
