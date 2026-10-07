/**
 * Logo components for Mesa Departamental de Competitividad de Quetzaltenango.
 * Isotype: the official emblem PNG (gold ring, mountains, ram, arrows).
 */
import emblemSrc from "./imports/loading-isotype.png";

interface LogoIsotypeProps {
  size?: number;
  className?: string;
}

export function LogoIsotype({ size = 40, className }: LogoIsotypeProps) {
  return (
    <div
      className={`flex-shrink-0 aspect-square rounded-full overflow-hidden flex items-center justify-center bg-transparent ${className ?? ""}`}
      style={{ width: size, height: size }}
    >
      <img
        src={emblemSrc}
        alt="Emblema Mesa de Competitividad de Quetzaltenango"
        className="w-full h-full object-contain block"
      />
    </div>
  );
}

interface LogoFullProps {
  size?: number;
  dark?: boolean;
  className?: string;
  compact?: boolean;
}

export function LogoFull({ size = 36, dark = false, className, compact = false }: LogoFullProps) {
  const textPrimary   = dark ? "text-navy-100" : "text-brand-dark";
  const textSecondary = dark ? "text-gold-400"  : "text-navy-600";

  return (
    <div className={`flex items-center gap-3 ${className ?? ""}`}>
      <LogoIsotype size={size} />
      {!compact && (
        <div className="min-w-0">
          <p className={`text-[10px] font-semibold uppercase tracking-[0.14em] leading-none ${textSecondary}`}>
            Mesa Departamental de
          </p>
          <p className={`text-[14px] font-black uppercase tracking-wide leading-tight ${textPrimary}`}>
            Competitividad
          </p>
          <p className={`text-[11px] font-bold leading-none mt-0.5 ${textSecondary}`}>
            Quetzaltenango
          </p>
        </div>
      )}
    </div>
  );
}

export default LogoIsotype;
