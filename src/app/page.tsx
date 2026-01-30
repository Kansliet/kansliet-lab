import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

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
          <p className="text-normal-case max-w-2xl text-lg font-light leading-relaxed mb-8">
            A state-of-the-art foundation for building modern web applications.
            Clean, industrial, and uncompromisingly functional.
          </p>
          <div className="flex gap-4">
            <Button>GET STARTED</Button>
            <Button variant="secondary">LEARN MORE</Button>
          </div>
        </div>
      </section>

      <section className="border-b-brutal py-20">
        <div className="container-kansliet">
          <h3 className="text-caps mb-12 text-2xl font-light tracking-wide">
            COMPONENTS
          </h3>

          <div className="space-y-12">
            <div>
              <h4 className="text-caps mb-6 text-sm font-normal tracking-wider">
                BUTTONS
              </h4>
              <div className="flex flex-wrap gap-4">
                <Button variant="primary">PRIMARY</Button>
                <Button variant="secondary">SECONDARY</Button>
                <Button variant="ghost">GHOST</Button>
                <Button variant="link">LINK</Button>
              </div>
            </div>

            <div>
              <h4 className="text-caps mb-6 text-sm font-normal tracking-wider">
                INPUT
              </h4>
              <div className="max-w-md">
                <Input type="text" placeholder="ENTER TEXT" />
              </div>
            </div>

            <div>
              <h4 className="text-caps mb-6 text-sm font-normal tracking-wider">
                CARDS
              </h4>
              <div className="grid gap-6 md:grid-cols-2 max-w-4xl">
                <Card>
                  <CardHeader>
                    <CardTitle>CARD HEADER</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-normal-case text-sm font-light leading-relaxed">
                      Card content goes here. This demonstrates the brutalist
                      aesthetic with sharp edges and high contrast borders.
                    </p>
                  </CardContent>
                </Card>
                <Card className="bg-foreground text-background">
                  <CardHeader className="border-b-2 border-background">
                    <CardTitle>INVERTED CARD</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-normal-case text-sm font-light leading-relaxed">
                      Cards can be inverted for emphasis and visual hierarchy
                      within the brutalist design system.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
