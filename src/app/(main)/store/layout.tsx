import { CartIcon } from "@/components/store/CartIcon";

export default function StoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
      <CartIcon />
    </>
  );
}
