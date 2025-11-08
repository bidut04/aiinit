import { NextRequest, NextResponse } from "next/server";
import { Redis } from '@upstash/redis';

// ✅ CRITICAL: Use REST URL, not regular Redis URL
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!
});

// Debug: Log configuration (remove in production)
console.log('Redis URL exists:', !!process.env.UPSTASH_REDIS_REST_URL);
console.log('Redis token exists:', !!process.env.UPSTASH_REDIS_REST_TOKEN);

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get('sessionId');
    
    console.log('Restore session ID:', sessionId);

    if (!sessionId) {
      return NextResponse.json(
        { success: false, error: 'Session ID required' },
        { status: 400 }
      );
    }

    // ✅ Use correct key pattern: form:${sessionId}
    console.log('Attempting to get key:', `form:${sessionId}`);
    const redisData = await redis.get(`form:${sessionId}`);

    if (redisData) {
      console.log('Data found in Redis for session:', sessionId);
      return NextResponse.json({
        success: true,
        data: redisData
      });
    }

    console.log('No data found in Redis for session:', sessionId);
    return NextResponse.json({
      success: true,
      data: null
    });
  } catch (error) {
    console.error('Restore error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to restore data' },
      { status: 500 }
    );
  }
}