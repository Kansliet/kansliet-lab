"use server";

import { redirect } from "next/navigation";
import { pool } from "@/lib/db";
import { verifyFormToken } from "@/lib/form-token";
import { sendCustomerEmail } from "@/lib/mail";
import { orderRef, parseOrderRef } from "@/lib/order-email";
import { buildWithdrawalEmail } from "@/lib/withdrawal-email";
import { WITHDRAW_PATH } from "@/lib/shop-info";

const MAX_NAME = 200;
const MAX_EMAIL = 254;
const MAX_ORDER_REF = 40;

/** On an error, what was typed comes back: React resets a form after its action runs. */
export type WithdrawState = { error?: string; values?: { name: string; order: string; email: string } };

/**
 * Records a withdrawal and emails the acknowledgement. The notice is logged
 * whether or not it matches an order: once a customer has sent it, they have
 * withdrawn, and a typo in the order number is for us to sort out by hand
 * (the admin list shows unmatched notices). Whether it matched is never shown
 * to the customer, so the form can't be used to probe for orders.
 */
export async function submitWithdrawal(
  _prevState: WithdrawState | null,
  formData: FormData,
): Promise<WithdrawState> {
  if (formData.get("_trap")) {
    redirect(`${WITHDRAW_PATH}?received`);
  }
  const name = formData.get("name")?.toString().trim() ?? "";
  const email = formData.get("email")?.toString().trim() ?? "";
  const typedRef = formData.get("order")?.toString().trim() ?? "";
  const fail = (error: string): WithdrawState => ({
    error,
    values: { name, order: typedRef, email },
  });

  if (!verifyFormToken(formData.get("_token")?.toString() ?? "")) {
    return fail("Something went wrong. Please refresh the page and try again.");
  }

  if (!name || !email || !typedRef) {
    return fail("Please fill in your name, order number and email.");
  }
  if (name.length > MAX_NAME) return fail("Name is too long.");
  if (email.length > MAX_EMAIL || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return fail("Please enter a valid email address.");
  }
  const orderId = typedRef.length <= MAX_ORDER_REF ? parseOrderRef(typedRef) : null;
  if (orderId === null) {
    return fail("That doesn't look like an order number. It's in your confirmation email, as in KDC-00042.");
  }
  const ref = orderRef(orderId);

  const { rows } = await pool.query<{ id: number; created_at: Date }>(
    `INSERT INTO shop_withdrawals (shop_order_id, order_ref, name, email)
     VALUES (
       (SELECT id FROM shop_orders WHERE id = $1 AND lower(customer_email) = lower($2)),
       $3, $4, $2
     )
     RETURNING id, created_at`,
    [orderId, email, ref, name],
  );
  const withdrawal = rows[0];

  try {
    await sendCustomerEmail(
      {
        to: email,
        ...buildWithdrawalEmail({ orderRef: ref, name, email, receivedAt: withdrawal.created_at }),
      },
      { tag: "WITHDRAWAL", orderRef: ref },
    );
    await pool.query("UPDATE shop_withdrawals SET acknowledged_at = now() WHERE id = $1", [
      withdrawal.id,
    ]);
  } catch (err) {
    // The notice is recorded either way; /admin/orders flags the missing
    // acknowledgement so one can be sent by hand.
    console.error(`Withdrawal ${withdrawal.id} (${ref}): acknowledgement email failed`, err);
  }

  redirect(`${WITHDRAW_PATH}?received=${orderId}`);
}
