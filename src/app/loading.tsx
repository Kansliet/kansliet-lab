import Image from "next/image";

export default function Loading() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <Image
          src="/kansliet-logo-footer_1.svg"
          alt=""
          width={40}
          height={40}
          className="w-10 h-10 animate-spin-slow block mx-auto mb-4"
        />
        <p className="text-caps text-sm font-light tracking-wider">LOADING</p>
      </div>
    </div>
  );
}
