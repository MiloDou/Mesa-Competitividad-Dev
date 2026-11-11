interface DocumentsSectionProps { data?: Record<string, any>; }

export default function DocumentsSection({ data }: DocumentsSectionProps) {
  return <section id="transparencia" className="border-t border-gray-200 bg-white py-8 lg:py-12">
    <div className="mx-auto max-w-screen-xl px-5 lg:px-10">
      <div className="mb-6">
        <h2 className="text-3xl font-extrabold uppercase tracking-wide text-navy-950 lg:text-4xl">{data?.title || "Transparencia institucional"}</h2>
        <p className="mt-2 text-slate-600">No hay documentos oficiales disponibles para publicación.</p>
      </div>
    </div>
  </section>;
}
