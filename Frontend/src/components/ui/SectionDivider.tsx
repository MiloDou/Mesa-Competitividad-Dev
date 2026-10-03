import React from "react";

export function SectionDivider() {
  return (
    <div className="w-full relative z-10 flex flex-col items-center justify-center my-2">
      {/* 3 Solid horizontal stripes inspired by the logo arrows */}
      <div className="w-full flex flex-col gap-1 px-4 max-w-screen-xl mx-auto">
        <div className="w-full h-1 bg-[#2400D6] rounded-full" />
        <div className="w-full h-1 bg-[#E5B82E] rounded-full shadow-sm" />
        <div className="w-full h-1 bg-[#FF0000] rounded-full" />
      </div>
    </div>
  );
}

export default SectionDivider;
