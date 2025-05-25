import { NextResponse } from "next/server"
import redis from "@/lib/redis-client"

export async function GET() {
  try {
    // Test Redis connection
    await redis.ping()

    // Fetch data from Redis
    const users = await redis.get("attendance-users")
    const records = await redis.get("attendance-records")
    const rates = await redis.get("attendance-rates")

    return NextResponse.json({
      redis: {
        available: true,
        users,
        records,
        rates,
      },
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Error fetching debug data:", error)
    return NextResponse.json(
      {
        redis: {
          available: false,
          error: error instanceof Error ? error.message : String(error),
        },
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
