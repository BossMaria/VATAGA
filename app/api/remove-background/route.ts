import { NextRequest, NextResponse } from "next/server";
import { appConfig } from "@/lib/config";

function jsonError(message: string, code: string, status: number) {
  return NextResponse.json({ error: message, code }, { status });
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return jsonError("Файл не найден в поле file.", "missing_file", 400);
    }

    if (!appConfig.acceptedImageTypes.includes(file.type as (typeof appConfig.acceptedImageTypes)[number])) {
      return jsonError(
        "Неподдерживаемый формат. Используйте PNG, JPG/JPEG или WebP.",
        "unsupported_type",
        415
      );
    }

    if (file.size > appConfig.maxFileSizeBytes) {
      return jsonError("Файл слишком большой для локальной обработки.", "file_too_large", 413);
    }

    const workerData = new FormData();
    workerData.append("file", file, file.name);

    const workerResponse = await fetch(`${appConfig.workerUrl}/remove-background`, {
      method: "POST",
      body: workerData,
      cache: "no-store"
    });

    if (!workerResponse.ok) {
      const payload = (await workerResponse.json().catch(() => null)) as
        | { error?: string; code?: string }
        | null;

      return jsonError(
        payload?.error || "Python worker не смог обработать изображение.",
        payload?.code || "worker_error",
        workerResponse.status
      );
    }

    const imageBuffer = await workerResponse.arrayBuffer();

    return new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Content-Disposition": 'inline; filename="cutout.png"',
        "Cache-Control": "no-store"
      }
    });
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "Не удалось соединиться с worker.",
      "internal_error",
      500
    );
  }
}
