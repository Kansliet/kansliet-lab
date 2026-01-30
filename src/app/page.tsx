import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import { Footer } from "@/components/footer";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b-brutal">
        <div className="container-kansliet">
          <div className="flex h-16 items-center justify-between">
            <h1 className="text-caps text-lg font-light tracking-wider">
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
          <h2 className="text-caps mb-8 text-lg font-light leading-tight tracking-tight">
            BRUTALIST
            <br />
            BASEPLATE
          </h2>
          <p className="text-normal-case max-w-2xl text-base font-light mb-8">
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
          <h3 className="text-caps mb-12 text-lg font-light tracking-wide">
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
                TEXTAREA
              </h4>
              <div className="max-w-md">
                <Textarea placeholder="ENTER MESSAGE" rows={4} />
              </div>
            </div>

            <div>
              <h4 className="text-caps mb-6 text-sm font-normal tracking-wider">
                SELECT
              </h4>
              <div className="max-w-md">
                <Select>
                  <option value="">SELECT OPTION</option>
                  <option value="1">OPTION ONE</option>
                  <option value="2">OPTION TWO</option>
                  <option value="3">OPTION THREE</option>
                </Select>
              </div>
            </div>

            <div>
              <h4 className="text-caps mb-6 text-sm font-normal tracking-wider">
                BADGES
              </h4>
              <div className="flex flex-wrap gap-3">
                <Badge>DEFAULT</Badge>
                <Badge variant="solid">SOLID</Badge>
                <Badge variant="outline">OUTLINE</Badge>
                <Badge>INDUSTRIAL DESIGN</Badge>
                <Badge>2025</Badge>
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
                    <p className="text-normal-case text-base font-light">
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
                    <p className="text-normal-case text-base font-light">
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

      <Footer />
    </div>
  );
}
