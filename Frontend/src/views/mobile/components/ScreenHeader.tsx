interface ScreenHeaderProps {
  title: string;
  sub: string;
  onBack: () => void;
}

export default function ScreenHeader({ title, sub, onBack }: ScreenHeaderProps) {
  return (
    <div className="bg-navy-950 px-5 pt-5 pb-6">
      <button onClick={onBack} className="flex items-center gap-2 text-celeste-400 hover:text-white text-sm mb-3 transition-colors font-semibold">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/>
        </svg>
        Inicio
      </button>
      <h2 style={{ fontFamily: "var(--font-display)" }} className="text-white text-3xl font-normal">{title}</h2>
      <p className="text-celeste-400 text-sm mt-0.5 font-medium">{sub}</p>
    </div>
  );
}
