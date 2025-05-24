import { databaseDrizzle } from "@/db"
import { checkAuth } from "@/lib/api_key"
import { tryAndCatch } from "@/lib/try-catch"
import { redisConnection } from "@/workers/redis"
import { NextRequest, NextResponse } from "next/server"
import { APIError } from "openai"


type Params = {
  params: Promise<{
    id: string
  }>
}

export async function POST(request: NextRequest, { params }: Params) {
  try {
    const {
      data: userId,
      error: authError,
    } = await tryAndCatch<string, APIError>(checkAuth(request))
    if (authError) {
      return NextResponse.json({
        code: authError.code,
        message: authError.message,
      }, { status: authError.status })
    }

    const { id } = await params
    const { data: conn, error: queryError } = await tryAndCatch(databaseDrizzle.query.connections.findFirst({
      where: (conn, ops) => ops.and(ops.eq(conn.userId, userId!), ops.eq(conn.id, id)),
      columns: {
        jobId: true,
      }
    }))
    if (queryError) {
      return NextResponse.json(
        {
          code: "internal_server_error",
          message: "Failed to load connection status",
        },
        { status: 500 },
      )
    }
    if (!conn) {
      return NextResponse.json(
        { code: 'not_found', message: 'Connection not found' },
        { status: 404 }
      )
    }
    if (!conn.jobId) {
      return NextResponse.json(
        { code: 'not_processing', message: 'No active processing job' },
        { status: 400 }
      )
    }
    const { error: redisError } = await tryAndCatch(
      redisConnection.set(`cancel-job:${conn.jobId}`, '1')
    )

    if (redisError) {
      return NextResponse.json(
        { code: 'internal_error', message: 'Failed to cancel processing' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { code: 'ok', message: 'Processing cancellation requested' },
      { status: 200 }
    )

  } catch (error: any) {
    return NextResponse.json(
      { code: "internal_server_error", message: error.message },
      { status: 500 },
    );
  }
}
