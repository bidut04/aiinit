import { NextRequest, NextResponse } from "next/server";
import { Redis } from '@upstash/redis';

// ✅ CORRECT: Use REST URL and token
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!
});

// Debug logging
console.log('Sync route - Redis configured:', {
  hasUrl: !!process.env.UPSTASH_REDIS_REST_URL,
  hasToken: !!process.env.UPSTASH_REDIS_REST_TOKEN
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { sessionId, formData, currentStep, timestamp } = body;

    if (!sessionId) {
      return NextResponse.json(
        { success: false, error: 'Session ID required' },
        { status: 400 }
      );
    }

    const dataToStore = {
      formData,
      currentStep,
      timestamp,
      lastSynced: new Date().toISOString()
    };

    // ✅ FIXED: Use correct key pattern and Upstash syntax
    // Note: Upstash Redis uses .set() with options, not .setex()
    await redis.set(
      `form:${sessionId}`,
      dataToStore,
      { ex: 86400 } // 24 hours in seconds (increased from 2 hours)
    );

    console.log(`✅ Synced form data for session: ${sessionId}`);

    return NextResponse.json({
      success: true,
      message: 'Data synced successfully'
    });
  } catch (error) {
    console.error('Sync error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to sync data' },
      { status: 500 }
    );
  }
}