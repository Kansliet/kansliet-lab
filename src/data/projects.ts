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
        src: "/images/projects/kallstorp/Källstorp_Interior_Kitchen_Final.jpg",
        alt: "Open-plan kitchen and dining area in light wood and concrete with custom cabinetry",
      },
      {
        src: "/images/projects/kallstorp/Källstorp_Interior_Diningroom_Final.jpg",
        alt: "Dining space with framed artworks and integrated kitchen wall in birch plywood",
      },
      {
        src: "/images/projects/kallstorp/Källstorp_Interior_Laundry_Final.jpg",
        alt: "Detail view of kitchen island and bar seating, with graphic yellow wall poster",
      },
      {
        src: "/images/projects/kallstorp/Källstorp_Interior_Livingoom_Final.jpg",
        alt: "Detail view of kitchen island and bar seating, with graphic yellow wall poster",
      },
      {
        src: "/images/projects/kallstorp/Källstorp_Interior_Livingroom_Final_2.jpg",
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
        src: "/images/projects/smeg-nespresso/smeg_propeller_final_wide_front_view.jpg",
        alt: "Stacked Smeg x Nespresso concept machine with ceramic cup, minimalist studio backdrop",
      },
      {
        src: "/images/projects/smeg-nespresso/smeg_propeller_final_exploded_motion_4.jpg",
        alt: "Lineup of modular espresso machines showing vertical assembly with matching cups",
      },
      {
        src: "/images/projects/smeg-nespresso/smeg_propeller_final_wide_perspective.jpg",
        alt: "Exploded view of coffee machine components, emphasizing modular construction",
      },
      {
        src: "/images/projects/smeg-nespresso/smeg_propeller_detail.jpg",
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
    id: "roppongi",
    title: "ROPPONGI",
    category: "Industrial Design",
    year: "2025",
    tagline:
      "A mechanically articulated lighting system focused on precision, adjustability, and light control.",
    description: [
      "Roppongi is a lighting and spatial design project. Kansliet developed the visual and product direction, from concept to final execution.",
      "The work explores material, form, and light in a restrained system that can scale across contexts.",
    ],
    tags: ["INDUSTRIAL", "LIGHTING", "PRODUCT", "SPATIAL"],
    images: [
      {
        src: "/images/projects/roppongi/roppongi_lamp_view_1_grain.jpg",
        alt: "Roppongi lamp front view",
      },
      {
        src: "/images/projects/roppongi/roppongi_lamp_view_3_grain.jpg",
        alt: "Roppongi lamp alternate angle",
      },
      {
        src: "/images/projects/roppongi/roppongi_lamp_view_2_grain.jpg",
        alt: "Roppongi lamp view with textured surface",
      },
    ],
    specs: [
      { label: "CLIENT", value: "KANSLIET (HARDWARE)" },
      { label: "YEAR", value: "2025" },
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
        src: "/images/projects/frank-and-stein/frank_stein_logotype_NEW_0001.jpg",
        alt: "Frank & Stein café counter with signage, muted materials, and staff preparing drinks",
      },
      {
        src: "/images/projects/frank-and-stein/frank_stein_NEW_0000.jpg",
        alt: "Frank & Stein café exterior with sand toned façade and warm interior lighting in Jumeirah",
      },
      {
        src: "/images/projects/frank-and-stein/frank_stein_NEW_0001.jpg",
        alt: "Three-quarter view of layered plywood bench constructed from repeated slices",
      },
      {
        src: "/images/projects/frank-and-stein/frank_stein_coffee_bag_NEW_0001.jpg",
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
        src: "/images/projects/nothing/nothing_2a_detail_top.jpg",
        alt: "Render of Community Edition Nothing Phone concept with translucent back",
      },
      {
        src: "/images/projects/nothing/nothing_2a_back.jpg",
        alt: "Detail view of dual camera housing in raw aluminum frame with micro-textured chamfer",
      },
      {
        src: "/images/projects/nothing/nothing_2a_detail_bottom.jpg",
        alt: "Rear view of concept phone showing circuit-inspired engraving and translucent paneling",
      },
      {
        src: "/images/projects/nothing/nothing_2a_back_front.jpg",
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
        src: "/images/projects/aime-leon-dore/ALD_38-GS_3200x4000_HIRES0000.jpg",
        alt: "Side view render of the Aimé Leon Dore and Technohull speedboat on a white background",
      },
      {
        src: "/images/projects/aime-leon-dore/_Z727464.jpg",
        alt: "Aimé Leon Dore and Technohull speedboat moving at high speed on open water with a helicopter",
      },
      {
        src: "/images/projects/aime-leon-dore/SU23_Technohull_Boat_and_Graphics_-12.19.jpg",
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
        src: "/images/projects/ebay-x-elton-john/eBay-Rocket-Man-Resale-Hero-16x9.jpg",
        alt: "Elton John standing in a wardrobe room for the eBay charity sale campaign",
      },
      {
        src: "/images/projects/ebay-x-elton-john/eBay-Rocket-Man-Resale-wardrobe.jpg",
        alt: "Clothing and accessories displayed on a red background for the eBay charity sale campaign",
      },
      {
        src: "/images/projects/ebay-x-elton-john/eBay-Rocket-Man-Resale-16x9.jpg",
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
        src: "/images/projects/cannaluxe/cannaluxe_kansliet_view_1.jpg",
        alt: "Cannaluxe skincare products displayed outdoors with shadowed palm leaves in the background",
      },
      {
        src: "/images/projects/cannaluxe/cannaluxe_kansliet_view_4.jpg",
        alt: "Cannaluxe skincare bottles arranged on a white background in a straight-line layout",
      },
      {
        src: "/images/projects/cannaluxe/cannaluxe_kansliet_view_5.jpg",
        alt: "Cannaluxe skincare products arranged together on a light background",
      },
      {
        src: "/images/projects/cannaluxe/cannaluxe_kansliet_view_3.jpg",
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
