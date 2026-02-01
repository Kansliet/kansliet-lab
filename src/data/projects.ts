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
    tagline:
      "A brutalist approach to industrial product design with focus on functional aesthetics and material honesty.",
    description: [
      "The project explores the intersection of form and function through careful material selection and manufacturing processes.",
      "Each component is designed with attention to structural integrity and visual clarity, creating a cohesive system that emphasizes honesty in construction.",
    ],
    tags: ["PRODUCT", "INDUSTRIAL", "MINIMAL"],
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
      { label: "CLIENT", value: "Confidential" },
      { label: "YEAR", value: "2025" },
      { label: "ROLE", value: "Lead Designer" },
    ],
  },
  {
    id: "waffries",
    title: "WAFFRIES",
    category: "Interior Design",
    year: "2023",
    tagline:
      "Restaurant interior combining brutalist architecture with warm, inviting spaces for casual dining.",
    description: [
      "The design creates a balance between raw concrete surfaces and comfortable seating arrangements.",
      "Strategic lighting and material choices transform industrial elements into a welcoming hospitality environment.",
    ],
    tags: ["INTERIOR", "HOSPITALITY", "SPATIAL"],
    images: [
      { src: "/images/placeholder.jpg", alt: "Waffries - Interior 1" },
      { src: "/images/placeholder.jpg", alt: "Waffries - Interior 2" },
      { src: "/images/placeholder.jpg", alt: "Waffries - Detail" },
    ],
    specs: [
      { label: "CLIENT", value: "Waffries AB" },
      { label: "YEAR", value: "2023" },
      { label: "LOCATION", value: "Stockholm, Sweden" },
    ],
  },
  {
    id: "kallstorp",
    title: "KÄLLSTORP",
    category: "Spatial Design",
    year: "2022",
    tagline:
      "Residential space design emphasizing natural light and material texture within a constrained footprint.",
    description: [
      "The project demonstrates how compact spaces can feel expansive through strategic design decisions.",
      "Careful attention to proportions and material transitions creates a sense of openness despite the limited square footage.",
    ],
    tags: ["RESIDENTIAL", "SPATIAL", "ARCHITECTURE"],
    images: [
      { src: "/images/placeholder.jpg", alt: "Källstorp - Space 1" },
      { src: "/images/placeholder.jpg", alt: "Källstorp - Space 2" },
    ],
    specs: [
      { label: "CLIENT", value: "Private" },
      { label: "YEAR", value: "2022" },
      { label: "SIZE", value: "85 m²" },
    ],
  },
  {
    id: "smeg-nespresso",
    title: "SMEG X NESPRESSO",
    category: "Product Design",
    year: "2024",
    tagline:
      "A visual and functional exercise in restraint, merging SMEG's retro-futurist DNA with Nespresso's compact, system-based logic.",
    description: [
      "This collaborative effort involved developing concept directions and product visualization for a proposed partnership between SMEG and Nespresso.",
      "Kansliet's role was to support the industrial design process with early-stage concept refinement, material studies, and visual narratives. The goal was to help both brands explore how their identities might co-exist in a shared product expression, one that felt intuitive, premium, and unmistakably designed.",
      "Renderings were produced for internal alignment and external pitching, balancing technical realism with emotional tone. The design work emphasized tactile surfaces, minimal interfaces, and an object language that could live comfortably in both brands' ecosystems.",
    ],
    tags: ["PRODUCT", "COLLABORATION", "APPLIANCE"],
    images: [
      { src: "/images/placeholder.jpg", alt: "SMEG Nespresso - Product" },
      { src: "/images/placeholder.jpg", alt: "SMEG Nespresso - Detail" },
    ],
    specs: [
      { label: "CLIENT", value: "SMEG / Nespresso" },
      { label: "YEAR", value: "2024" },
      { label: "CATEGORY", value: "Product Design" },
    ],
  },
  {
    id: "frank-stein",
    title: "FRANK & STEIN",
    category: "Brand Identity",
    year: "2021",
    tagline:
      "Complete brand identity for a modern beer brewery with a focus on bold typography and minimal color palette.",
    description: [
      "The identity system includes logo, packaging, interior signage, and digital presence.",
      "Each touchpoint maintains consistency while adapting to different scales and applications, from bottle labels to large-format wall graphics.",
    ],
    tags: ["IDENTITY", "BRANDING", "PACKAGING"],
    images: [
      { src: "/images/placeholder.jpg", alt: "Frank & Stein - Identity" },
      { src: "/images/placeholder.jpg", alt: "Frank & Stein - Application" },
    ],
    specs: [
      { label: "CLIENT", value: "Frank & Stein Brewery" },
      { label: "YEAR", value: "2021" },
      { label: "SCOPE", value: "Full Identity System" },
    ],
  },
  {
    id: "nothing",
    title: "NOTHING",
    category: "Industrial Design",
    year: "2024",
    tagline:
      "Consumer electronics design focusing on transparency and honesty in materials.",
    description: [
      "The project challenges conventional approaches to tech product design through visible components and minimal ornamentation.",
      "By exposing the internal architecture, the design celebrates the engineering and craftsmanship that typically remains hidden in consumer electronics.",
    ],
    tags: ["ELECTRONICS", "INDUSTRIAL", "TRANSPARENCY"],
    images: [
      { src: "/images/placeholder.jpg", alt: "Nothing - Product" },
      { src: "/images/placeholder.jpg", alt: "Nothing - Details" },
    ],
    specs: [
      { label: "CLIENT", value: "Nothing Technology" },
      { label: "YEAR", value: "2024" },
      { label: "ROLE", value: "Design Consultant" },
    ],
  },
];
