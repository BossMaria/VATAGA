import { UploadCard } from "@/components/upload-card";

export default function Home() {
  return (
    <main className="page-shell">
      <section className="hero">
        <p className="eyebrow">Local Background Removal</p>
        <h1>Удаляйте фон у изображений за пару кликов.</h1>
        <p className="hero-copy">
          Загрузите фото, запустите обработку и скачайте прозрачный PNG.
          Вся цепочка уже разделена на UI, API и Python worker, чтобы позже
          было проще вынести сервис в онлайн.
        </p>
      </section>
      <UploadCard />
    </main>
  );
}
