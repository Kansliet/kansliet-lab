export interface Project {
  id: string;
  title: string;
  category: string;
  year: string;
  tagline: string;
  description: string[];
  tags: string[];
  images: Array<{ src: string; alt: string }>;
  specs: Array<{ label: string; value: string }>;
}

export const projects: Project[] = [
  {
    id: "laminar-01",
    title: "LAMINAR-01",
    category: "Industrial Design",
    year: "2025",
    tagline: "A modular seating system built from repeated plywood layers.",
    description: [
      "We used a rhythm of CNC-machined slices to define the structure, optimized for efficient fabrication.",
      "The system is built from a single profile, repeated and separated by steel spacers. This constraint dictates the form and keeps the process simple. The resulting geometry shifts with the viewing angle—appearing as a solid mass from one side and a transparent grid from another.",
      "The rounded edges soften the strict repetition, creating a continuous flow. Function is integrated directly into the form; storage and power are routed through the negative space between the layers. It’s a system designed for minimal waste, simple assembly, and clean utility in shared spaces.",
    ],
    tags: ["FURNITURE", "PLYWOOD", "CNC", "SYSTEM"],
    images: [
      {
        src: "/images/projects/laminar-01/super_seat_part_0_v2_WEB.jpg",
        alt: "Laminar 01 super seat part view",
      },
      {
        src: "/images/projects/laminar-01/super_seat_part_1_v2_WEB.jpg",
        alt: "Laminar 01 super seat detail shot",
      },
      {
        src: "/images/projects/laminar-01/super_seat_part_5_WEB.jpg",
        alt: "Laminar 01 super seat assembly view",
      },
    ],
    specs: [
      { label: "CLIENT", value: "KANSLIET (HARDWARE)" },
      { label: "YEAR", value: "2025" },
      { label: "MATERIAL", value: "Birch Plywood / Steel" },
    ],
  },
  {
    id: "waffries",
    title: "WAFFRIES",
    category: "Interior Design, Brand Identity",
    year: "2023",
    tagline:
      "Visual and spatial design for a QSR concept located in Mall of the Emirates, Dubai.",
    description: [
      "Waffries is a quick-service restaurant in Mall of the Emirates in Dubai. Kansliet designed the full identity and interior system, from naming and logotype to spatial layout, signage, and material palette.",
      "The goal was to build a clear and playful brand that could stand out in a dense retail environment without losing structure or efficiency. Every element was reduced to essentials to support a fast operational flow.",
      "The interior uses a simple palette and modular layout that keeps the space calm and functional at high volume. Signage and menu systems were designed to work across multiple scales, from storefront visibility to on-counter navigation.",
    ],
    tags: ["INTERIOR", "BRANDING", "HOSPITALITY", "DUBAI"],
    images: [
      {
        src: "/images/projects/waffries/waffries.webp",
        alt: "Vector illustration of waffle icon in isometric style on solid orange background",
      },
      {
        src: "/images/projects/waffries/flatlay.jpg",
        alt: "Flat lay of branded waffles and dipping sauces arranged in a repeating grid",
      },
      {
        src: "/images/projects/waffries/lifestyle.jpg",
        alt: "Lifestyle shot of model holding Waffries sign with repeating logo",
      },
    ],
    specs: [
      { label: "CLIENT", value: "BRAVO CREATIVE PTE LTD" },
      { label: "YEAR", value: "2023" },
      { label: "LOCATION", value: "Dubai, UAE" },
    ],
  },
  {
    id: "kallstorp",
    title: "KÄLLSTORP",
    category: "Interior Design",
    year: "2022",
    tagline: "Interior and visualization work for a local housing development.",
    description: [
      "Källstorp is a contemporary housing series developed by a local carpenter with a focus on sustainable construction, circular materials, and wood as the primary design element, both for environmental and contextual reasons.",
      "Kansliet contributed to the interior design and visual direction in close collaboration with the builder and architect. The aim was to support the architecture's low-impact ethos with interiors that feel warm, durable, and quietly modern.",
      "The visualizations were produced to align with both technical planning and atmospheric intent, a tool for communicating design decisions before they existed physically.",
    ],
    tags: ["INTERIOR", "VISUALIZATION", "RESIDENTIAL", "SUSTAINABLE"],
    images: [
      {
        src: "/images/projects/kallstorp/kitchen.jpg",
        alt: "Open-plan kitchen and dining area in light wood and concrete with custom cabinetry",
      },
      {
        src: "/images/projects/kallstorp/dining.jpg",
        alt: "Dining space with framed artworks and integrated kitchen wall in birch plywood",
      },
      {
        src: "/images/projects/kallstorp/detail.jpg",
        alt: "Detail view of kitchen island and bar seating, with graphic yellow wall poster",
      },
    ],
    specs: [
      { label: "CLIENT", value: "BYGGHJÄLP" },
      { label: "YEAR", value: "2022" },
      { label: "ROLE", value: "Interior & Visualization" },
    ],
  },
  {
    id: "smeg-nespresso",
    title: "SMEG X NESPRESSO",
    category: "Industrial Design",
    year: "2024",
    tagline:
      "A visual and functional exercise in restraint, merging SMEG's retro-futurist DNA with Nespresso's compact, system-based logic.",
    description: [
      "This collaborative effort involved developing concept directions and product visualization for a proposed partnership between SMEG and Nespresso.",
      "Kansliet's role was to support the industrial design process with early-stage concept refinement, material studies, and visual narratives. The goal was to help both brands explore how their identities might co-exist in a shared product expression, one that felt intuitive, premium, and unmistakably designed.",
      "Renderings were produced for internal alignment and external pitching, balancing technical realism with emotional tone. The design work emphasized tactile surfaces, minimal interfaces, and an object language that could live comfortably in both brands' ecosystems.",
    ],
    tags: ["INDUSTRIAL", "PRODUCT", "COLLABORATION", "CONCEPT"],
    images: [
      {
        src: "/images/projects/smeg-nespresso/hero.jpg",
        alt: "Stacked Smeg x Nespresso concept machine with ceramic cup, minimalist studio backdrop",
      },
      {
        src: "/images/projects/smeg-nespresso/lineup.jpg",
        alt: "Lineup of modular espresso machines showing vertical assembly with matching cups",
      },
      {
        src: "/images/projects/smeg-nespresso/exploded.jpg",
        alt: "Exploded view of coffee machine components, emphasizing modular construction",
      },
    ],
    specs: [
      { label: "CLIENT", value: "CONCEPT" },
      { label: "YEAR", value: "2024" },
      { label: "ROLE", value: "Industrial Design" },
    ],
  },
  {
    id: "frank-and-stein",
    title: "FRANK & STEIN",
    category: "Interior Design, Brand Identity",
    year: "2021",
    tagline:
      "A café and social space in the Jumeirah district of Dubai, designed with soft geometry, muted materials, and a calm sense of presence.",
    description: [
      "Frank & Stein is a café and social space in the Jumeirah district of Dubai. The concept was built around a single idea: sand. A tonal environment shaped by the textures and colors of the surrounding coast, designed to feel calm, contemporary, and rooted in place.",
      "The identity and interior were developed together as one system. Soft geometry, layered seating platforms, and a restrained palette form the core of the experience. Typography, signage, and color were kept minimal so the atmosphere could carry the brand rather than compete with it.",
    ],
    tags: ["INTERIOR", "BRANDING", "HOSPITALITY", "DUBAI"],
    images: [
      {
        src: "/images/projects/frank-stein/exterior.jpg",
        alt: "Frank & Stein café exterior with sand toned façade and warm interior lighting in Jumeirah",
      },
      {
        src: "/images/projects/frank-stein/counter.jpg",
        alt: "Frank & Stein café counter with signage, muted materials, and staff preparing drinks",
      },
      {
        src: "/images/projects/frank-stein/bench.jpg",
        alt: "Three-quarter view of layered plywood bench constructed from repeated slices",
      },
    ],
    specs: [
      { label: "CLIENT", value: "Frank & Stein" },
      { label: "YEAR", value: "2021" },
      { label: "LOCATION", value: "Dubai, UAE" },
    ],
  },
  {
    id: "nothing",
    title: "NOTHING",
    category: "Industrial Design",
    year: "2024",
    tagline: "A study in transparency, form, and visual logic.",
    description: [
      "As part of the Nothing Community Edition challenge, Kansliet submitted a visual and conceptual interpretation of Nothing's design language, exploring how core principles like clarity, transparency, and precision could evolve across product formats.",
      "Working within the constraints of their established language, the design pushed for slightly softer transitions, simpler construction, and a clearer relationship between internal and external elements. Rendered in-house using custom 3D workflows.",
      "This project served as both a technical benchmark and a lens into Kansliet's approach to design: minimalist, expressive, and systems-oriented, even in speculative form.",
    ],
    tags: ["INDUSTRIAL", "CONCEPT", "TECH", "TRANSPARENCY"],
    images: [
      {
        src: "/images/projects/nothing/back.jpg",
        alt: "Render of Community Edition Nothing Phone concept with translucent back",
      },
      {
        src: "/images/projects/nothing/camera.jpg",
        alt: "Detail view of dual camera housing in raw aluminum frame with micro-textured chamfer",
      },
      {
        src: "/images/projects/nothing/rear.jpg",
        alt: "Rear view of concept phone showing circuit-inspired engraving and translucent paneling",
      },
    ],
    specs: [
      { label: "CLIENT", value: "CONCEPT" },
      { label: "YEAR", value: "2024" },
      { label: "ROLE", value: "INDUSTRIAL DESIGN" },
    ],
  },
  {
    id: "aime-leon-dore",
    title: "AIMÉ LEON DORE",
    category: "3D Visualization",
    year: "2023",
    tagline:
      "A studio-grade render of the Aimé Leon Dore and Technohull speedboat.",
    description: [
      "Aimé Leon Dore partnered with Technohull to release a limited-edition speedboat. Kansliet was brought in via Studio Joa to produce a single, high-detail render of the boat, intended to match a studio-grade product photo.",
      "The actual boat was unavailable for controlled photography, so the image needed to stand on its own in digital environments. The rendering was modeled and built entirely from scratch, including geometry, lighting, and materials.",
    ],
    tags: ["3D", "VISUALIZATION", "MARINE", "FASHION"],
    images: [
      {
        src: "/images/projects/aime-leon-dore/side.jpg",
        alt: "Side view render of the Aimé Leon Dore and Technohull speedboat on a white background",
      },
      {
        src: "/images/projects/aime-leon-dore/water.jpg",
        alt: "Aimé Leon Dore and Technohull speedboat moving at high speed on open water with a helicopter",
      },
      {
        src: "/images/projects/aime-leon-dore/elevation.jpg",
        alt: "Technical side elevation renders of the Aimé Leon Dore and Technohull speedboat",
      },
    ],
    specs: [
      { label: "CLIENT", value: "Aimé Leon Dore / Studio Joa" },
      { label: "YEAR", value: "2023" },
      { label: "ROLE", value: "3D Visualization" },
    ],
  },
  {
    id: "ebay-x-elton-john",
    title: "EBAY X ELTON JOHN",
    category: "3D Visualization",
    year: "2024",
    tagline: "Hero Image Composition for Global Campaign.",
    description: [
      "Commissioned by Studio Joa for eBay, we were asked to create a promotional image of Elton John seated in his walk-in wardrobe, surrounded by stage pieces from his personal archive. All garments were part of a charity auction hosted through eBay.",
      "The challenge: Elton was photographed in London, the wardrobe archive was in New York, and eBay required a single, realistic image. To solve this, we built a fully 3D-modelled closet and produced a technical layout with precise camera positioning, lens data, and subject scale.",
      "A placeholder set was constructed in NYC based on our specs. Garments were shot on location, while Elton was captured separately under matched conditions. The final environment was rendered and everything composited into one cohesive image.",
    ],
    tags: ["3D", "VISUALIZATION", "CAMPAIGN", "COMPOSITING"],
    images: [
      {
        src: "/images/projects/ebay-elton/wardrobe.jpg",
        alt: "Elton John standing in a wardrobe room for the eBay charity sale campaign",
      },
      {
        src: "/images/projects/ebay-elton/garments.jpg",
        alt: "Clothing and accessories displayed on a red background for the eBay charity sale campaign",
      },
      {
        src: "/images/projects/ebay-elton/display.jpg",
        alt: "Retail display shelf with illuminated backdrop for the eBay charity sale campaign",
      },
    ],
    specs: [
      { label: "CLIENT", value: "eBay / Studio Joa" },
      { label: "YEAR", value: "2024" },
      { label: "ROLE", value: "Set Design & 3D" },
    ],
  },
  {
    id: "cannaluxe",
    title: "CANNALUXE",
    category: "Packaging Design",
    year: "2021",
    tagline: "3D product visualization for a skincare line.",
    description: [
      "We created a set of photoreal 3D product visuals for Cannaluxe, developed to present the full skincare line before production. The aim was to support early marketing, packaging alignment, and investor communication with images that functioned as stand-ins for physical prototypes.",
      "Working from preliminary shapes and label directions, each product was modeled and rendered using a controlled V-Ray workflow focused on material accuracy and soft-surface fidelity. The visuals helped guide decisions across design and production while keeping the presentation consistent and precise.",
    ],
    tags: ["PACKAGING", "3D", "VISUALIZATION", "SKINCARE"],
    images: [
      {
        src: "/images/projects/cannaluxe/outdoors.jpg",
        alt: "Cannaluxe skincare products displayed outdoors with shadowed palm leaves in the background",
      },
      {
        src: "/images/projects/cannaluxe/lineup.jpg",
        alt: "Cannaluxe skincare bottles arranged on a white background in a straight-line layout",
      },
      {
        src: "/images/projects/cannaluxe/group.jpg",
        alt: "Cannaluxe skincare products arranged together on a light background",
      },
    ],
    specs: [
      { label: "CLIENT", value: "Cannaluxe" },
      { label: "YEAR", value: "2021" },
      { label: "ROLE", value: "3D Visualization" },
    ],
  },
];
