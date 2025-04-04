import { processingUpdates } from "@/events";
import { redisConnection } from "@/workers/redis";

export async function GET(request: Request) {

  const headers = new Headers({
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    "Connection": "keep-alive",
  });

  const subscriber = redisConnection.duplicate();
  await subscriber.subscribe(processingUpdates);

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start: (controller) => {
      const messageHandler = (channel: string, data: string) => {
        if (channel === processingUpdates) {
          controller.enqueue(encoder.encode(`data: ${data}\n\n`));
        }
      }

      subscriber.on('message', messageHandler)

      request.signal.addEventListener('abort', async () => {
        subscriber.off('message', messageHandler)
        await subscriber.unsubscribe(processingUpdates);
        subscriber.disconnect();
      });
    },
    cancel() {
      subscriber.disconnect()
    }
  });

  return new Response(stream, { headers });
}
