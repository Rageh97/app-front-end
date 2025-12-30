"use client";
import { FunctionComponent, useEffect, useState } from "react";
import Image from "next/image";

const PremiumLoader: FunctionComponent = () => {
  return (
    <div className="fixed inset-0 z-[999999] flex flex-col items-center justify-center bg-[#0a0118]">
      {/* Background radial glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#ff7702]/10 blur-[120px] rounded-full"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-[#00c48c]/10 blur-[100px] rounded-full delay-700"></div>

      <div className="relative flex flex-col items-center">
        {/* Animated Rings */}
        <div className="relative w-32 h-32 mb-8">
          <div className="absolute inset-0 rounded-full border-2 border-t-[#ff7702] border-r-transparent border-b-transparent border-l-transparent animate-spin-fast"></div>
          <div className="absolute inset-2 rounded-full border-2 border-t-transparent border-r-[#00c48c] border-b-transparent border-l-transparent animate-spin-reverse"></div>
          <div className="absolute inset-4 rounded-full border-2 border-t-transparent border-r-transparent border-b-[#4f008c] border-l-transparent animate-spin-slow"></div>
          
          {/* Central Logo/Icon */}
          <div className="absolute inset-0 flex items-center justify-center">
            <img 
              src="/images/icon.png.png" 
              alt="Nexus Logo" 
              className="w-16 h-16 object-contain animate-pulse"
            />
          </div>
        </div>

        {/* Text and Progress */}
        <div className="flex flex-col items-center space-y-4">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-[#ff7702] via-white to-[#00c48c] bg-clip-text text-transparent animate-pulse tracking-widest uppercase">
            Nexus Toolz
          </h2>
          
          <div className="w-48 h-1 overflow-hidden bg-white/10 rounded-full relative">
            <div className="absolute inset-y-0 left-0 bg-gradient-to-r from-[#ff7702] to-[#00c48c] animate-progress-fill rounded-full"></div>
          </div>
          
        
        </div>
      </div>

    </div>
  );
};

export default PremiumLoader;
