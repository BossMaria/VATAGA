from io import BytesIO
from typing import Final

from fastapi import FastAPI, File, UploadFile
from fastapi.responses import JSONResponse, Response
from PIL import Image, UnidentifiedImageError
from rembg import remove


ACCEPTED_IMAGE_TYPES: Final[set[str]] = {"image/png", "image/jpeg", "image/webp"}
MAX_FILE_SIZE_BYTES: Final[int] = 10 * 1024 * 1024

app = FastAPI(title="Cutout Worker", version="0.1.0")


def error_response(message: str, code: str, status_code: int) -> JSONResponse:
    return JSONResponse(
        status_code=status_code,
        content={"error": message, "code": code},
    )


@app.get("/health")
def healthcheck() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/remove-background", response_model=None)
async def remove_background(file: UploadFile = File(...)) -> Response:
    if file.content_type not in ACCEPTED_IMAGE_TYPES:
        return error_response(
            "Неподдерживаемый формат. Используйте PNG, JPG/JPEG или WebP.",
            "unsupported_type",
            415,
        )

    file_bytes = await file.read()
    if not file_bytes:
        return error_response("Файл пустой.", "empty_file", 400)

    if len(file_bytes) > MAX_FILE_SIZE_BYTES:
        return error_response(
            "Файл слишком большой для локальной обработки.",
            "file_too_large",
            413,
        )

    try:
        source_image = Image.open(BytesIO(file_bytes))
        normalized_source = source_image.convert("RGBA")
    except UnidentifiedImageError:
        return error_response("Не удалось прочитать изображение.", "invalid_image", 400)

    try:
        result_bytes = remove(normalized_source)
    except Exception:
        return error_response(
            "Модель не смогла удалить фон у этого изображения.",
            "processing_failed",
            422,
        )

    if isinstance(result_bytes, Image.Image):
        buffer = BytesIO()
        result_bytes.save(buffer, format="PNG")
        payload = buffer.getvalue()
    else:
        payload = result_bytes

    return Response(content=payload, media_type="image/png")
