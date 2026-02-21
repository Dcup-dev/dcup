import { databaseDrizzle } from '@/db';
import { users } from '@/db/schema';
import { Plans } from '@/lib/Plans';
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
          const planMapping: Record<string, keyof typeof Plans> = {
            [process.env.NEXT_PUBLIC_PADDLE_BASIC_PRICE_ID!]: "BASIC",
            [process.env.NEXT_PUBLIC_PADDLE_PRO_PRICE_ID!]: "PRO",
            [process.env.NEXT_PUBLIC_PADDLE_BUSINESS_PRICE_ID!]: "BUSINESS",
            [process.env.NEXT_PUBLIC_PADDLE_ENTERPRISE_PRICE_ID!]: "ENTERPRISE",
          };

          for (const item of event.data.items) {
            const priceId = item.price?.id || "";
            const planData = planMapping[priceId];

            if (!planData) {
              throw new Error(`Invalid priceId: ${priceId}`);
            }

            await databaseDrizzle
              .update(users)
              .set({
                plan: planData,
                apiCalls: 0
              })
              .where(eq(users.customerId, event.data.customerId));
          }
          break;
        }
        if (event.data.status === 'paused' ||
          event.data.status === 'canceled' ||
          event.data.status === 'past_due') {
          await databaseDrizzle
            .update(users)
            .set({
              plan: "FREE",
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
