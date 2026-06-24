import "server-only";
import Stripe from "stripe";
import { config } from "./config";

/**
 * Stripe wrapper. In demo mode (no STRIPE_SECRET_KEY) payments are simulated:
 * a fake intent id is returned and the payment is treated as authorized.
 * The architecture is Stripe Connect-ready for paying drivers later.
 */

let stripeSingleton: Stripe | null = null;

export function getStripe(): Stripe | null {
  if (!config.stripe.enabled) return null;
  if (!stripeSingleton) {
    stripeSingleton = new Stripe(config.stripe.secretKey!);
  }
  return stripeSingleton;
}

export interface RideIntent {
  intentId: string;
  clientSecret: string | null;
  status: "authorized" | "pending";
  demo: boolean;
}

/**
 * Create (or simulate) a pre-authorization PaymentIntent for a ride.
 * Uses manual capture so the final amount can be captured at trip end.
 */
export async function createRidePaymentIntent(rideId: string, amountEuros: number): Promise<RideIntent> {
  const stripe = getStripe();
  if (!stripe) {
    return { intentId: `demo_pi_${rideId}`, clientSecret: null, status: "authorized", demo: true };
  }
  const intent = await stripe.paymentIntents.create({
    amount: Math.round(amountEuros * 100),
    currency: "eur",
    capture_method: "manual",
    metadata: { rideId },
  });
  return { intentId: intent.id, clientSecret: intent.client_secret, status: "pending", demo: false };
}
