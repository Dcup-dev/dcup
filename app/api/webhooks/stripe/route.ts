
import Stripe from "stripe";
import { eq } from "drizzle-orm";
import { stripe } from "@/lib/stripe";
import { databaseDrizzle } from "@/db";
import { users } from "@/db/schemas/users";
import { vSizes } from "@/lib/constants";

const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: Request) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");
  if (!sig) {
    return new Response("Missing stripe-signature header", { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, WEBHOOK_SECRET);
  } catch (err: any) {
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }

  // Handle the event
  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = await stripe.checkout.sessions.retrieve(
          (event.data.object as Stripe.Checkout.Session).id,
          { expand: ["line_items"] }
        );
        const customerId = session.customer as string;
        const customerDetails = session.customer_details;

        if (!customerDetails?.email) {
          throw new Error("User not found or invalid");
        }

        const lineItems = session.line_items?.data || [];
        for (const item of lineItems) {
          const priceId = item.price?.id;

          if (priceId === process.env.STRIPE_BASIC_PRICE_ID) {
            await databaseDrizzle
              .update(users)
              .set({ plan: 'Basic', volume: vSizes.MB_50, customerId: customerId })
              .where(eq(users.email, customerDetails.email))
            break;
          }

          if (priceId === process.env.STRIPE_PRO_PRICE_ID) {
            await databaseDrizzle
              .update(users)
              .set({ plan: 'Pro', volume: vSizes.MB_250, customerId: customerId })
              .where(eq(users.email, customerDetails.email))
            break;
          }

          if (priceId === process.env.STRIPE_BUSINESS_PRICE_ID) {
            await databaseDrizzle
              .update(users)
              .set({ plan: 'Business', volume: vSizes.GB_5, customerId: customerId })
              .where(eq(users.email, customerDetails.email))
            break;
          }

          if (priceId === process.env.STRIPE_ENTERPRISE_PRICE_ID) {
            await databaseDrizzle
              .update(users)
              .set({ plan: 'Enterprise', volume: vSizes.GB_15, customerId: customerId })
              .where(eq(users.email, customerDetails.email))
            break;
          } else {
            throw new Error("Invalid priceId");
          }
        }
      }

      case "customer.subscription.deleted": {
        const subscription = await stripe.subscriptions.retrieve(
          (event.data.object as Stripe.Subscription).id
        );
        console.log({ subscription })
        try {
          await databaseDrizzle.update(users).set({
            plan: "Free",
            volume: 0,
          }).where(eq(users.customerId, subscription.customer as string));
          break;

        } catch (error) {
          console.log({ error })
        }
      }

      case "customer.deleted": {
        const customerId = (event.data.object as Stripe.Customer).id;
        await databaseDrizzle.update(users).set({
          plan: "Free",
          volume: 0,
        }).where(eq(users.customerId, customerId));
        break;
      }

    }
  } catch (err: any) {
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }

  return new Response("Webhook received", { status: 200 });
}
