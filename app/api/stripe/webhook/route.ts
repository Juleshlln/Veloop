import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { config } from "@/lib/config";
import { getStripe } from "@/lib/payments";
import { db } from "@/lib/data/store";

/**
 * Secured Stripe webhook. Verifies the signature with STRIPE_WEBHOOK_SECRET
 * and reconciles payment status. In demo mode it acknowledges without action.
 */
export async function POST(request: Request) {
  const stripe = getStripe();
  if (!stripe || !config.stripe.webhookSecret) {
    return NextResponse.json({ received: true, demo: true });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Signature manquante." }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    const body = await request.text();
    event = stripe.webhooks.constructEvent(body, signature, config.stripe.webhookSecret);
  } catch (err) {
    return NextResponse.json(
      { error: `Signature invalide : ${err instanceof Error ? err.message : "inconnue"}` },
      { status: 400 },
    );
  }

  switch (event.type) {
    case "payment_intent.succeeded":
    case "payment_intent.amount_capturable_updated": {
      const intent = event.data.object as Stripe.PaymentIntent;
      await db.setPaymentStatusByIntent(intent.id, event.type === "payment_intent.succeeded" ? "paid" : "authorized");
      break;
    }
    case "payment_intent.payment_failed": {
      const intent = event.data.object as Stripe.PaymentIntent;
      await db.setPaymentStatusByIntent(intent.id, "failed");
      break;
    }
    case "charge.refunded": {
      const charge = event.data.object as Stripe.Charge;
      if (charge.payment_intent) {
        await db.setPaymentStatusByIntent(String(charge.payment_intent), "refunded");
      }
      break;
    }
    default:
      break;
  }

  return NextResponse.json({ received: true });
}
