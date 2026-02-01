import Image from "next/image";

export function RotatingLogo() {
  return (
    <div className="inline-block animate-rotate-ping-pong">
      <Image
        src="/kansliet-logo-footer_1.svg"
        alt="Kansliet"
        width={33}
        height={33}
        className="select-none"
      />
    </div>
  );
}
