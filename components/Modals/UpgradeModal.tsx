'use client';

import React from 'react';
import Link from 'next/link';
import { Crown, ChevronLeft } from 'lucide-react';
import { PremiumButton } from '@/components/PremiumButton';
import { BorderBeam } from '@/components/ui/border-beam';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
}

const UpgradeModal: React.FC<UpgradeModalProps> = ({
  isOpen,
  onClose,
  title = 'رصيدك غير كافٍ',
  description = 'لقد استهلكت كامل نقاطك في الباقة الحالية. قم بالترقية الآن للحصول على المزيد من النقاط والوصول الكامل لجميع ميزات نيكسوس برو.',
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center px-6">
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-md animate-fade-in"
        onClick={onClose}
      />
      <div className="relative w-full max-w-lg bg-[#0a0a0a] border border-white/10 rounded-[3rem] p-10 text-center shadow-2xl animate-fade-in-up overflow-hidden">
        {/* Decorative background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-purple-600/20 blur-[80px] rounded-full pointer-events-none" />

        <div className="relative z-10">
          <div className="w-20 h-20 bg-gradient-to-tr from-purple-600 to-blue-600 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-purple-900/40">
            <Crown size={40} className="text-white animate-pulse" />
          </div>

          <h2 className="text-3xl md:text-4xl font-black mb-4 leading-tight">
            <span className="block text-white">{title}</span>
            <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
              لإكمال هذه العملية
            </span>
          </h2>

          <p className="text-gray-500 mb-10 text-lg leading-relaxed font-bold">
            {description}
          </p>

          <div className="space-y-4">
            <Link href="/ai/plans" className="block w-full">
              <PremiumButton
                label="استعراض باقات الاشتراك"
                icon={Crown}
                secondaryIcon={ChevronLeft}
                className="w-full h-16 rounded-2xl text-lg md:text-xl"
              />
            </Link>
          </div>
        </div>

        {/* Border Beam Effect */}
        <BorderBeam
          size={200}
          duration={8}
          colorFrom="#9c40ff"
          colorTo="rgba(0, 255, 149, 1)"
          borderWidth={2}
        />
      </div>
    </div>
  );
};

export default UpgradeModal;
