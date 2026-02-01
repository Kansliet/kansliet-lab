export default function ProjectLoading() {
  return (
    <div className="flex-1 bg-background flex flex-col">
      <div className="flex-1 border-b-brutal py-20">
        <div className="container-kansliet">
          <div className="space-y-4 mb-12">
            <div className="h-8 w-48 bg-foreground/10 animate-pulse"></div>
            <div className="flex gap-2">
              <div className="h-6 w-20 bg-foreground/10 animate-pulse"></div>
              <div className="h-6 w-20 bg-foreground/10 animate-pulse"></div>
            </div>
            <div className="h-4 w-32 bg-foreground/10 animate-pulse"></div>
          </div>

          <div className="grid gap-12 lg:grid-cols-2">
            <div className="aspect-4/5 bg-foreground/5 border-brutal animate-pulse"></div>

            <div className="space-y-8">
              <div className="space-y-4">
                <div className="h-4 w-32 bg-foreground/10 animate-pulse"></div>
                <div className="space-y-2">
                  <div className="h-3 bg-foreground/10 animate-pulse"></div>
                  <div className="h-3 bg-foreground/10 animate-pulse"></div>
                  <div className="h-3 w-2/3 bg-foreground/10 animate-pulse"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
