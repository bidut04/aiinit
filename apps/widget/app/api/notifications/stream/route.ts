import { NextRequest } from "next/server";
// In your SSE route
import { createRedisSubscriber, CHANNELS } from "@workspace/lib/redis";
import { getServerSession } from "next-auth";
import { authOptions } from "@workspace/auth";

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const GET = async (req: NextRequest) => {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return new Response('Unauthorized', { status: 401 });
  }

  const encoder = new TextEncoder();
  let subscriber: any = null;

  const stream = new ReadableStream({
    async start(controller) {
      try {
        // Send initial connection message
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: 'connected' })}\n\n`)
        );

        // Create Redis subscriber using ioredis
        subscriber = createRedisSubscriber();

        // Subscribe to channel
        await subscriber.subscribe(CHANNELS.NEW_APPLICATION);

        // Listen for messages
        subscriber.on('message', (channel: string, message: string) => {
          try {
            if (channel !== CHANNELS.NEW_APPLICATION) return;
            
            const data = JSON.parse(message);
            
            // Only send to relevant admins
            if (session.user.role === 'SUPERADMIN' && data.adminIds?.includes(session.user.id)) {
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ 
                  type: 'new-application',
                  ...data 
                })}\n\n`)
              );
            }
          } catch (error) {
            console.error('Error parsing notification message:', error);
          }
        });

        // Handle Redis errors
        subscriber.on('error', (error: Error) => {
          console.error('Redis subscriber error:', error);
        });

        // Keep-alive ping every 30 seconds
        const keepAlive = setInterval(() => {
          try {
            controller.enqueue(encoder.encode(': keep-alive\n\n'));
          } catch (error) {
            clearInterval(keepAlive);
          }
        }, 30000);

        // Cleanup on close
        req.signal.addEventListener('abort', async () => {
          clearInterval(keepAlive);
          
          if (subscriber) {
            try {
              await subscriber.unsubscribe(CHANNELS.NEW_APPLICATION);
              await subscriber.quit();
            } catch (error) {
              console.error('Error cleaning up subscriber:', error);
            }
          }
          
          try {
            controller.close();
          } catch (error) {
            // Controller may already be closed
          }
        });

      } catch (error) {
        console.error('SSE stream error:', error);
        controller.error(error);
      }
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
    }
  });
};