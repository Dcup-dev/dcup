import { databaseDrizzle } from '@/db';
import { users } from '@/db/schemas/users';
import { vSizes } from '@/lib/constants';
import { Paddle, EventName, EventEntity } from '@paddle/paddle-node-sdk'
import { eq } from 'drizzle-orm';

const paddle = new Paddle(process.env.PADDLE_API_KEY!)

const secretKey = process.env.PADDLE_NOTIFICATION_WEBHOOK_SECRET!

export async function POST(req: Request) {

  const body = await req.text();
  const sig = req.headers.get("Paddle-Signature") ?? req.headers.get("paddle-signature");

  if (!sig) {
    return new Response("Missing paddle-signature header", { status: 400 });
  }

  let event: EventEntity;
  try {
    event = await paddle.webhooks.unmarshal(body, secretKey, sig);
  } catch (err: any) {
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }

  try {
    switch (event.eventType) {
      case EventName.CustomerCreated:
      case EventName.CustomerUpdated:
        await databaseDrizzle
          .update(users)
          .set({ customerId: event.data.id })
          .where(eq(users.email, event.data.email));
        break;

      case EventName.SubscriptionUpdated:
      case EventName.SubscriptionCreated:

        if (event.data.status === 'active') {

          const planMapping: Record<string, { plan: "Free" | "Basic" | "Pro" | "Business" | "Enterprise"; volume: number }> = {
            [process.env.NEXT_PUBLIC_PADDLE_BASIC_PRICE_ID!]: { plan: "Basic", volume: vSizes.MB_50 },
            [process.env.NEXT_PUBLIC_PADDLE_PRO_PRICE_ID!]: { plan: "Pro", volume: vSizes.MB_250 },
            [process.env.NEXT_PUBLIC_PADDLE_BUSINESS_PRICE_ID!]: { plan: "Business", volume: vSizes.GB_5 },
            [process.env.NEXT_PUBLIC_PADDLE_ENTERPRISE_PRICE_ID!]: { plan: "Enterprise", volume: vSizes.GB_15 },
          };
          
          for (const item of event.data.items) {
            const priceId = item.price?.id || "";
            const planData = planMapping[priceId];

            if (!planData) {
              throw new Error(`Invalid priceId: ${priceId}`);
            }

            await databaseDrizzle
              .update(users)
              .set(planData)
              .where(eq(users.customerId, event.data.customerId));
          }
          break;
        }
        if (event.data.status === 'paused' ||
          event.data.status === 'canceled' ||
          event.data.status === 'past_due') {
          await databaseDrizzle.update(users).set({
            plan: "Free",
            volume: 0,
          }).where(eq(users.customerId, event.data.customerId));
          break;
        }

      default:
        return new Response(`Event ignored ${event.eventType}`, { status: 200 });
    }
  } catch (err: any) {
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }

  return new Response("Webhook processed successfully", { status: 200 });
}
