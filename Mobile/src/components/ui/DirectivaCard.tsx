import { DirectivaMember } from "../../types/public";
import { ROLE_SHORT } from "../../data/public";

const SOLID_PALETTES = [
  // 0: Dorado
  {
    topAccent: "bg-gold-500",
    badgeBorder: "border-gold-500/70",
    badgeText: "text-gold-400",
    roleText: "text-gold-500",
    borderHover: "group-hover:bg-gold-500",
    titleHover: "group-hover:text-gold-300",
  },
  // 1: Azul
  {
    topAccent: "bg-blue-600",
    badgeBorder: "border-blue-500/70",
    badgeText: "text-blue-400",
    roleText: "text-blue-400",
    borderHover: "group-hover:bg-blue-500",
    titleHover: "group-hover:text-blue-300",
  },
  // 2: Rojo
  {
    topAccent: "bg-red-600",
    badgeBorder: "border-red-500/70",
    badgeText: "text-red-400",
    roleText: "text-red-400",
    borderHover: "group-hover:bg-red-500",
    titleHover: "group-hover:text-red-300",
  },
];

const RANDOM_COLOR_SEQUENCE = [1, 0, 2, 0, 2, 1, 2, 0, 1, 0, 1, 2, 2, 0, 1, 1, 2, 0];

export function DirectivaCard({ member, index }: {
  member: DirectivaMember;
  index: number;
}) {
  const colorIdx = RANDOM_COLOR_SEQUENCE[Math.abs(index) % RANDOM_COLOR_SEQUENCE.length];
  const st = SOLID_PALETTES[colorIdx];

  return (
    <div className="card-frame-hover card-lift group relative bg-navy-900 border border-navy-800 rounded-2xl overflow-hidden cursor-default"
         style={{ animationDelay:`${index * 0.07}s` }}>
      {/* Top accent line */}
      <div className={`h-1.5 ${st.topAccent}`} />

      <div className="flex gap-0">
        {/* Photo column — wider now that card is full-column */}
        <div className="relative w-[130px] flex-shrink-0">
          <div className="absolute inset-0 border-r-2 border-navy-800 z-10 pointer-events-none" />
          <img
            src={member.photo}
            alt={member.name}
            className="w-full h-full object-cover object-top"
            style={{ minHeight:"180px" }}
          />
          {/* Role badge */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20">
            <div className={`bg-navy-950 border ${st.badgeBorder} rounded-xl px-2.5 py-1.5 text-center shadow-xl`}>
              <span style={{ fontFamily:"var(--font-mono)" }} className={`${st.badgeText} text-[10px] font-black tracking-widest leading-none block`}>
                {ROLE_SHORT[member.role] ?? member.role.slice(0,4).toUpperCase()}
              </span>
            </div>
          </div>
        </div>

        {/* Details column */}
        <div className="flex-1 min-w-0 p-4 flex flex-col justify-between">
          <div>
            {/* Name */}
            <p style={{ fontFamily:"var(--font-display)" }}
               className={`text-white ${st.titleHover} font-normal text-[18px] leading-snug mb-1 transition-colors duration-200`}>
              {member.name}
            </p>
            {/* Role */}
            <p className={`${st.roleText} text-[11px] font-bold uppercase tracking-widest mb-3`}>{member.role}</p>
            {/* Divider */}
            <div className="h-px bg-navy-800 mb-3" />
            {/* Org */}
            <p className="text-navy-400 text-[13px] leading-snug">{member.org}</p>
          </div>

          {/* Bottom identifier */}
          <div className="mt-4 flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-navy-900 flex items-center justify-center flex-shrink-0">
              <span style={{ fontFamily:"var(--font-mono)" }} className="text-gold-400 text-[8px] font-bold">{member.initials}</span>
            </div>
            <span className="text-[10px] text-navy-500 font-semibold uppercase tracking-wider">Mesa Departamental de Competitividad</span>
          </div>
        </div>
      </div>

      {/* Bottom accent */}
      <div className={`h-0.5 bg-navy-800 ${st.borderHover} transition-colors duration-300`} />
    </div>
  );
}
