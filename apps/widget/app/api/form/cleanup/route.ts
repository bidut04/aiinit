import { NextRequest, NextResponse } from "next/server";
import { Redis } from '@upstash/redis';

// ✅ Use Upstash Redis REST API (correct for Upstash)
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!
});

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json(
        { success: false, error: 'Session ID required' },
        { status: 400 }
      );
    }

    // ✅ Use consistent key pattern: form:${sessionId}
    console.log(`Attempting to delete key: form:${sessionId}`);
    const result = await redis.del(`form:${sessionId}`);
    
    console.log(`✅ Deleted Redis key form:${sessionId}, deleted: ${result > 0}`);

    return NextResponse.json({
      success: true,
      message: 'Data cleaned up',
      deleted: result > 0
    });
  } catch (error) {
    console.error('Cleanup error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to cleanup' },
      { status: 500 }
    );
  }
}