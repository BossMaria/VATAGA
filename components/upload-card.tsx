"use client";

import Image from "next/image";
import { ChangeEvent, DragEvent, useEffect, useMemo, useRef, useState } from "react";

const ACCEPTED_TYPES = ["image/png", "image/jpeg", "image/webp"];

type Status =
  | { tone: "info"; message: string }
  | { tone: "success"; message: string }
  | { tone: "error"; message: string };

function formatFileSize(bytes: number) {
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(0)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function UploadCard() {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [sourcePreviewUrl, setSourcePreviewUrl] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>({
    tone: "info",
    message: "Поддерживаются PNG, JPG и WebP. Результат будет доступен только в PNG."
  });
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (!file) {
      setSourcePreviewUrl(null);
      return;
    }

    const nextUrl = URL.createObjectURL(file);
    setSourcePreviewUrl(nextUrl);

    return () => URL.revokeObjectURL(nextUrl);
  }, [file]);

  useEffect(() => {
    return () => {
      if (resultUrl) {
        URL.revokeObjectURL(resultUrl);
      }
    };
  }, [resultUrl]);

  const previewMeta = useMemo(() => {
    if (!file) {
      return null;
    }

    return `${file.type.replace("image/", "").toUpperCase()} • ${formatFileSize(file.size)}`;
  }, [file]);

  function resetResult() {
    setStatus({
      tone: "info",
      message: "Файл готов к обработке. Нажмите кнопку, чтобы удалить фон."
    });

    setResultUrl((current) => {
      if (current) {
        URL.revokeObjectURL(current);
      }

      return null;
    });
  }

  function applyFile(nextFile: File | null) {
    if (!nextFile) {
      return;
    }

    if (!ACCEPTED_TYPES.includes(nextFile.type)) {
      setStatus({
        tone: "error",
        message: "Неподдерживаемый формат. Загрузите PNG, JPG/JPEG или WebP."
      });
      return;
    }

    setFile(nextFile);
    resetResult();
  }

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const nextFile = event.target.files?.[0] ?? null;
    applyFile(nextFile);
  }

  function handleDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setIsDragging(false);

    const nextFile = event.dataTransfer.files?.[0] ?? null;
    applyFile(nextFile);
  }

  async function handleProcess() {
    if (!file || isProcessing) {
      return;
    }

    setIsProcessing(true);
    setStatus({
      tone: "info",
      message: "Удаляем фон. Это может занять несколько секунд."
    });

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/remove-background", {
        method: "POST",
        body: formData
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as
          | { error?: string; code?: string }
          | null;
        throw new Error(payload?.error ?? "Не удалось обработать изображение.");
      }

      const blob = await response.blob();
      setResultUrl((current) => {
        if (current) {
          URL.revokeObjectURL(current);
        }

        return URL.createObjectURL(blob);
      });
      setStatus({
        tone: "success",
        message: "Готово. PNG с прозрачным фоном можно скачать ниже."
      });
    } catch (error) {
      setStatus({
        tone: "error",
        message:
          error instanceof Error
            ? error.message
            : "Во время обработки произошла непредвиденная ошибка."
      });
    } finally {
      setIsProcessing(false);
    }
  }

  function triggerPicker() {
    inputRef.current?.click();
  }

  return (
    <section className="upload-card">
      <label
        className={`dropzone${isDragging ? " dragging" : ""}`}
        onDragEnter={() => setIsDragging(true)}
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
      >
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED_TYPES.join(",")}
          onChange={handleChange}
        />

        {!file || !sourcePreviewUrl ? (
          <div className="dropzone-empty">
            <div className="dropzone-empty-inner">
              <div className="spark-badge" />
              <h2>Перетащите изображение или выберите файл</h2>
              <p>
                Локальный интерфейс для удаления фона. Вся обработка идет через
                API-роут и Python worker, поэтому архитектуру легко развивать
                дальше.
              </p>
              <div className="hint-row">
                <span className="pill">PNG</span>
                <span className="pill">JPG</span>
                <span className="pill">WebP</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="preview-pane">
            <div className="preview-header">
              <div>
                <h2>Исходное изображение</h2>
                <div className="preview-meta">{previewMeta}</div>
              </div>
              <button className="secondary-button" type="button" onClick={triggerPicker}>
                Заменить файл
              </button>
            </div>
            <div className="preview-stage">
              <Image
                src={sourcePreviewUrl}
                alt="Исходное изображение"
                fill
                unoptimized
                sizes="(max-width: 920px) 100vw, 60vw"
              />
            </div>
          </div>
        )}
      </label>

      <aside className="result-panel">
        <div>
          <h2>Результат</h2>
          <p className="panel-copy">
            Первый релиз удаляет фон и возвращает только прозрачный PNG. Никакие
            изображения не сохраняются.
          </p>
        </div>

        <div className={`status ${status.tone}`}>{status.message}</div>

        <div className="button-row">
          <button
            className="primary-button"
            type="button"
            disabled={!file || isProcessing}
            onClick={handleProcess}
          >
            {isProcessing ? "Обработка..." : "Удалить фон"}
          </button>
          <button
            className="secondary-button"
            type="button"
            disabled={isProcessing}
            onClick={triggerPicker}
          >
            Выбрать файл
          </button>
          {resultUrl ? (
            <a className="secondary-button" href={resultUrl} download="cutout.png">
              Скачать PNG
            </a>
          ) : null}
        </div>

        <div className="result-preview">
          {resultUrl ? (
            <Image
              src={resultUrl}
              alt="Изображение без фона"
              fill
              unoptimized
              sizes="(max-width: 920px) 100vw, 40vw"
            />
          ) : (
            <div className="dropzone-empty">
              <div className="dropzone-empty-inner">
                <p>Здесь появится PNG без фона после обработки.</p>
              </div>
            </div>
          )}
        </div>

        <p className="fine-print">
          Если обработка длится дольше обычного, интерфейс не отправит повторный
          запрос, пока текущий не завершится.
        </p>
      </aside>
    </section>
  );
}
