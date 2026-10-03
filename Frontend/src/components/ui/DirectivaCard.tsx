import { DIRECTIVA, ROLE_SHORT } from "../../data/public";
import { DirectivaMember } from "../../types/public";

export function DirectivaCard({ member, index }: {
  member: DirectivaMember;
  index: number;
}) {
  return (
    <div className="card-frame-hover card-lift group relative bg-white border border-gray-200 shadow-md rounded-2xl overflow-hidden cursor-default"
         style={{ animationDelay:`${index * 0.07}s` }}>
      {/* Gold top accent line */}
      <div className="h-1.5 bg-gradient-to-r from-gold-600 via-gold-400 to-gold-500" />

      <div className="flex gap-0">
        {/* Photo column */}
        <div className="relative w-[130px] flex-shrink-0">
          <div className="absolute inset-0 border-r-2 border-gray-100 z-10 pointer-events-none" />
          <img
            src={member.photo}
            alt={member.name}
            className="w-full h-full object-cover object-top"
            style={{ minHeight:"180px" }}
          />
          {/* Role badge */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20">
            <div className="bg-white border border-gold-500 rounded-xl px-2.5 py-1.5 text-center shadow-lg">
              <span style={{ fontFamily:"var(--font-mono)" }} className="text-gold-700 text-[10px] font-extrabold tracking-widest leading-none block">
                {ROLE_SHORT[member.role] ?? member.role.slice(0,4).toUpperCase()}
              </span>
            </div>
          </div>
        </div>

        {/* Details column */}
        <div className="flex-1 min-w-0 p-4 flex flex-col justify-between">
          <div>
            {/* Name - Main card title */}
            <p className="text-navy-950 group-hover:text-gold-700 font-bold text-[17px] leading-snug mb-1 transition-colors duration-200">
              {member.name}
            </p>
            {/* Role */}
            <p className="text-gold-700 text-[11px] font-extrabold uppercase tracking-widest mb-3">{member.role}</p>
            {/* Divider */}
            <div className="h-px bg-gray-100 mb-3" />
            {/* Org */}
            <p className="text-slate-600 text-[13px] leading-snug font-normal">{member.org}</p>
          </div>

          {/* Bottom identifier */}
          <div className="mt-4 flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-gray-50 border border-gold-500/40 flex items-center justify-center flex-shrink-0">
              <span style={{ fontFamily:"var(--font-mono)" }} className="text-gold-700 text-[8px] font-bold">{member.initials}</span>
            </div>
            <span className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">Mesa Departamental de Competitividad</span>
          </div>
        </div>
      </div>

      {/* Bottom accent */}
      <div className="h-0.5 bg-gray-200 group-hover:bg-gold-500 transition-colors duration-300" />
    </div>
  );
}
