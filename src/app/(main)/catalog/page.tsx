import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import {
  Grid,
  GridItem,
  GridItemImage,
  GridItemContent,
  GridItemTitle,
  GridItemMeta,
} from "@/components/ui/grid";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";
import { Carousel } from "@/components/ui/carousel";

export default function CatalogPage() {
  if (process.env.NODE_ENV !== "development") {
    redirect("/");
  }

  return (
    <div className="flex-1 bg-background flex flex-col">
      <section className="border-b-brutal py-24">
        <div className="container-kansliet">
          <h2 className="text-caps mb-8 text-lg font-light leading-tight tracking-tight">
            COMPONENT
            <br />
            CATALOG
          </h2>
          <p className="text-normal-case max-w-2xl text-base font-light mb-8">
            A collection of all UI components available in the design system.
          </p>
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

            <div>
              <h4 className="text-caps mb-6 text-sm font-normal tracking-wider">
                GRID SYSTEM
              </h4>
              <Grid cols={3} gap={4}>
                <GridItem>
                  <GridItemImage>
                    <div className="flex h-full items-center justify-center bg-foreground/5">
                      <span className="text-caps text-sm opacity-40">IMAGE</span>
                    </div>
                  </GridItemImage>
                  <GridItemContent>
                    <GridItemTitle>PRODUCT 01</GridItemTitle>
                    <GridItemMeta>Industrial Design, 2025</GridItemMeta>
                  </GridItemContent>
                </GridItem>
                <GridItem>
                  <GridItemImage>
                    <div className="flex h-full items-center justify-center bg-foreground/5">
                      <span className="text-caps text-sm opacity-40">IMAGE</span>
                    </div>
                  </GridItemImage>
                  <GridItemContent>
                    <GridItemTitle>PRODUCT 02</GridItemTitle>
                    <GridItemMeta>Spatial Design, 2024</GridItemMeta>
                  </GridItemContent>
                </GridItem>
                <GridItem>
                  <GridItemImage>
                    <div className="flex h-full items-center justify-center bg-foreground/5">
                      <span className="text-caps text-sm opacity-40">IMAGE</span>
                    </div>
                  </GridItemImage>
                  <GridItemContent>
                    <GridItemTitle>PRODUCT 03</GridItemTitle>
                    <GridItemMeta>Identity Design, 2023</GridItemMeta>
                  </GridItemContent>
                </GridItem>
              </Grid>
            </div>

            <div>
              <h4 className="text-caps mb-6 text-sm font-normal tracking-wider">
                TABS
              </h4>
              <Tabs defaultValue="specs">
                <TabsList>
                  <TabsTrigger value="specs">SPECIFICATIONS</TabsTrigger>
                  <TabsTrigger value="features">FEATURES</TabsTrigger>
                  <TabsTrigger value="support">SUPPORT</TabsTrigger>
                </TabsList>
                <TabsContent value="specs">
                  <p className="text-normal-case text-base font-light">
                    Technical specifications and product details go here.
                  </p>
                </TabsContent>
                <TabsContent value="features">
                  <p className="text-normal-case text-base font-light">
                    Key features and capabilities are listed here.
                  </p>
                </TabsContent>
                <TabsContent value="support">
                  <p className="text-normal-case text-base font-light">
                    Support documentation and resources available here.
                  </p>
                </TabsContent>
              </Tabs>
            </div>

            <div>
              <h4 className="text-caps mb-6 text-sm font-normal tracking-wider">
                DIALOG
              </h4>
              <Dialog>
                <DialogTrigger className="border-brutal bg-foreground text-background px-8 py-3 text-caps text-sm font-light tracking-wide transition-opacity hover:opacity-80">
                  OPEN DIALOG
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>PRODUCT DETAILS</DialogTitle>
                    <DialogDescription>
                      View complete specifications and information about this
                      product.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <p className="text-normal-case text-base font-light">
                      Detailed product information goes here.
                    </p>
                  </div>
                  <div className="mt-6 flex justify-end gap-4">
                    <DialogClose className="border-brutal bg-background text-foreground px-8 py-3 text-caps text-sm font-light tracking-wide transition-opacity hover:opacity-80">
                      CLOSE
                    </DialogClose>
                    <button className="border-brutal bg-foreground text-background px-8 py-3 text-caps text-sm font-light tracking-wide transition-opacity hover:opacity-80">
                      ADD TO CART
                    </button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div>
              <h4 className="text-caps mb-6 text-sm font-normal tracking-wider">
                CAROUSEL
              </h4>
              <div className="max-w-4xl">
                <Carousel
                  images={["IMAGE 01", "IMAGE 02", "IMAGE 03", "IMAGE 04"]}
                  autoplay={true}
                  interval={3000}
                />
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
