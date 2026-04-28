# Cutout MVP

Локальный MVP для удаления фона у изображений. UI построен на `Next.js`, а
обработка вынесена в отдельный `FastAPI` worker на Python с `rembg`.

## Что умеет v1

- принимает одно изображение через веб-интерфейс
- поддерживает `PNG`, `JPG/JPEG`, `WebP`
- удаляет фон и возвращает только прозрачный `PNG`
- не хранит пользовательские файлы

## Архитектура

- `app/` и `components/`: интерфейс и `POST /api/remove-background`
- `lib/config.ts`: общая конфигурация лимитов и адреса worker
- `worker/app.py`: Python worker, который удаляет фон
- `scripts/dev.sh`: единый локальный сценарий старта

## Локальный запуск

### Быстрый путь

1. Выполнить одну команду настройки:

   `./scripts/setup.sh`

2. Запустить оба сервиса:

   `npm run dev:all`

3. Открыть:

   `http://127.0.0.1:3000`

### Пошагово вручную

1. Установить Node-зависимости:

   `npm install`

2. Создать изолированное Python-окружение и установить зависимости:

   `python3 -m venv .venv`

   `.venv/bin/pip install -r worker/requirements.txt`

3. Скопировать пример env:

   `cp .env.example .env`

4. Запустить сразу оба сервиса:

   `npm run dev:all`

Интерфейс будет доступен на `http://127.0.0.1:3000`, worker на
`http://127.0.0.1:8000`.

### Отдельный запуск сервисов

- web: `npm run dev:web`
- worker: `npm run dev:worker`

Важно: worker лучше запускать только внутри `.venv`, потому что `rembg` и его
зависимости чувствительны к версиям `numpy` в глобальном Python-окружении.

### Проверка, что все работает

1. Откройте `http://127.0.0.1:8000/health`
2. Убедитесь, что видите `{"status":"ok"}`
3. Откройте `http://127.0.0.1:3000`
4. Загрузите `PNG`, `JPG` или `WebP`
5. Нажмите `Удалить фон`
6. Скачайте итоговый `PNG`

### Если что-то не запускается

- Если `3000` занят: остановите другое приложение на этом порту
- Если `8000` занят: остановите другой `uvicorn` или Python server
- Если `health` не открывается: сначала проверьте, что worker запущен
- Если фон не удаляется с первого раза: `rembg` может впервые догружать модель

## Как лучше открыть и просто пользоваться

Лучший вариант для этой версии:

- `Next.js` frontend и API-прокси на `Vercel`
- `FastAPI` worker с `rembg` на `Railway`

Почему именно так:

- текущий проект уже разделен на UI и Python-обработчик
- `Vercel` удобен для интерфейса и API-проксирования
- `Railway` проще для постоянного Python worker, чем пытаться запихнуть `rembg` прямо в Vercel

### Деплой на Vercel

1. Загрузите репозиторий на GitHub
2. Импортируйте проект в Vercel
3. Добавьте environment variable:

   `WORKER_URL=https://<your-railway-domain>`

4. При необходимости добавьте:

   `MAX_FILE_SIZE_MB=4`

Важно: у Vercel request/response payload limit для Functions составляет `4.5 MB`, поэтому для облачной версии лучше держать лимит около `4 MB`. Источник: [Vercel Functions Limits](https://vercel.com/docs/functions/limitations)

### Деплой worker на Railway

1. Создайте новый Railway project
2. Подключите тот же GitHub-репозиторий
3. Для сервиса worker используйте repo root
4. Укажите custom start command:

   `uvicorn worker.app:app --host 0.0.0.0 --port $PORT`

5. Сгенерируйте public domain в настройках Railway
6. Возьмите этот домен и вставьте в `WORKER_URL` на Vercel

Railway рекомендует настраивать monorepo через `Root Directory` и `Start Command` в настройках сервиса. Источник: [Railway Monorepo Guide](https://docs.railway.com/guides/monorepo), [Set a Start Command](https://docs.railway.com/guides/start-command)

### После деплоя

- открываете Vercel URL
- загружаете картинку
- нажимаете `Удалить фон`
- скачиваете `PNG`

## API контракт

`POST /api/remove-background`

- request: `multipart/form-data`
- поле: `file`
- success: `image/png`
- error: `{ "error": "message", "code": "machine_code" }`
