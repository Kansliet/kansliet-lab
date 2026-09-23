import { CartIcon } from "@/components/shop/CartIcon";

export default function ShopLayout({
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
