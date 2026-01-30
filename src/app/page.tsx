export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b-brutal">
        <div className="container-kansliet">
          <div className="flex h-16 items-center justify-between">
            <h1 className="text-caps text-xl font-light tracking-wider">
              KANSLIET
            </h1>
            <nav className="flex gap-8">
              <a
                href="#"
                className="text-caps text-sm font-light tracking-wide transition-opacity hover:opacity-60"
              >
                WORK
              </a>
              <a
                href="#"
                className="text-caps text-sm font-light tracking-wide transition-opacity hover:opacity-60"
              >
                ABOUT
              </a>
              <a
                href="#"
                className="text-caps text-sm font-light tracking-wide transition-opacity hover:opacity-60"
              >
                CONTACT
              </a>
            </nav>
          </div>
        </div>
      </header>

      <section className="border-b-brutal py-24">
        <div className="container-kansliet">
          <h2 className="text-caps mb-8 text-5xl font-light leading-tight tracking-tight">
            BRUTALIST
            <br />
            BASEPLATE
          </h2>
          <p className="text-normal-case max-w-2xl text-lg font-light leading-relaxed">
            A state-of-the-art foundation for building modern web applications.
            Clean, industrial, and uncompromisingly functional.
          </p>
        </div>
      </section>
    </div>
  );
}
