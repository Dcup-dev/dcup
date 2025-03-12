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
      try {
        subscriber.on('message', (_, data) => {
          controller.enqueue(encoder.encode(`data: ${data}\n\n`));
        })
      } catch (error) {
        subscriber.disconnect()
        controller.error(error);
      }

      request.signal.addEventListener('abort', async () => {
        console.log('Client disconnected, cleaning up');
        await subscriber.unsubscribe(processingUpdates);
        subscriber.disconnect();
      });
    },
  });

  return new Response(stream, { headers });
}
