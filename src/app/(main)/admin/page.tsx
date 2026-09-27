import { redirect } from "next/navigation";

// /admin has no page of its own; the orders list is the admin home (it
// sends anyone not logged in on to /login).
export default function AdminIndex() {
  redirect("/admin/orders");
}
