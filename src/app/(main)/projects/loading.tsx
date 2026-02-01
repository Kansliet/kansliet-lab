export default function ProjectsLoading() {
  return (
    <div className="flex-1 bg-background flex flex-col">
      <div className="flex-1 border-b-brutal py-20">
        <div className="container-kansliet">
          <div className="h-8 w-32 bg-foreground/10 mb-12 animate-pulse"></div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="border-brutal">
                <div className="aspect-4/5 bg-foreground/5 animate-pulse"></div>
                <div className="p-4 space-y-2">
                  <div className="h-4 bg-foreground/10 animate-pulse"></div>
                  <div className="h-3 w-2/3 bg-foreground/10 animate-pulse"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
