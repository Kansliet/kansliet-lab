export default function Loading() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block h-16 w-16 border-2 border-foreground border-t-transparent animate-spin mb-4"></div>
        <p className="text-caps text-sm font-light tracking-wider">LOADING</p>
      </div>
    </div>
  );
}
