import { setDirectUploadConnection } from "@/DataSource/DirectUpload/setDirectUploadConnection";
import { directProcessFiles } from "@/fileProcessors";
import { checkAuth } from "@/lib/api_key";
import { tryAndCatch } from "@/lib/try-catch";
import { addToProcessFilesQueue } from "@/workers/queues/jobs/processFiles.job";
import { NextRequest, NextResponse } from "next/server";
import { APIError } from "openai";

export async function POST(request: NextRequest) {
  const wait = request.nextUrl.searchParams.get("wait")

  try {
    const {
      data: userId,
      error: authError,
    } = await tryAndCatch<string, APIError>(checkAuth(request))

    if (authError) return NextResponse.json({
      code: authError.code,
      message: authError.message,
    }, { status: authError.status })

    const { data: formData, error: errorForm } = await tryAndCatch(request.formData());
    if (errorForm) return NextResponse.json({
      code: "bad_request",
      message: errorForm.message,
    }, { status: 400 })

    formData.set("userId", userId)
    const {
      data: filesConfig,
      error: errorConfig
    } = await tryAndCatch(setDirectUploadConnection(formData))

    if (errorConfig) return NextResponse.json({
      code: "bad_request",
      message: errorConfig.message,
    }, { status: 400 })

    if (wait === "true") {
      const { error } = await tryAndCatch(directProcessFiles(filesConfig))
      if (error) return NextResponse.json({
        code: "internal_server_error",
        message: error.message
      }, { status: 500 });

      return NextResponse.json({
        code: "ok",
        message: "Your file was successfully uploaded and processed.",
      }, { status: 200 })
    }

    const { error: errorQueue } = await tryAndCatch(addToProcessFilesQueue(filesConfig))
    if (errorQueue) return NextResponse.json({
      code: "internal_server_error",
      message: errorQueue.message,
    }, { status: 500 })

    return NextResponse.json({
      code: "ok",
      message: "Your file has been successfully uploaded and queued for processing.",
    }, { status: 200 })

  } catch (error: any) {
    return NextResponse.json({
      code: "internal_server_error",
      message: error.message,
    }, { status: 500 });
  }
}
