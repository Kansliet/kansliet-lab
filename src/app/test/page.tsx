import Image from "next/image";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import ImageTrail, { ImageTrailItem } from "@/components/fancy-image-trail";

const images = [
  "/images/projects/laminar-01/super_seat_part_0_v2_WEB.jpg",
  "/images/projects/laminar-01/super_seat_part_1_v2_WEB.jpg",
  "/images/projects/laminar-01/super_seat_part_5_WEB.jpg",
];

export default function TestPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <ImageTrail
        threshold={100}
        intensity={0.3}
        keyframes={{ scale: [0, 1, 1, 0], opacity: [0, 1, 1, 0] }}
        keyframesOptions={{
          duration: 1.5,
        }}
        repeatChildren={5}
        className="flex-1"
      >
        {images.map((image, index) => (
          <ImageTrailItem key={index}>
            <div className="relative w-32 h-40">
              <Image
                src={image}
                alt="Trail"
                fill
                className="object-cover"
                sizes="128px"
                unoptimized
              />
            </div>
          </ImageTrailItem>
        ))}
      </ImageTrail>

      <Footer />
    </div>
  );
}
