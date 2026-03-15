"use client";
import React from "react";
import { X, User, ChevronRight } from "lucide-react";

interface MultiAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  toolName: string;
  accounts: any[];
  onSelect: (toolId: number) => void;
}

const MultiAccountModal: React.FC<MultiAccountModalProps> = ({
  isOpen,
  onClose,
  toolName,
  accounts,
  onSelect,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div 
        className="relative w-full max-w-md animate-in fade-in zoom-in duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative overflow-hidden p-[2px] rounded-2xl bg-gradient-to-r from-[#4f008c] via-[#00c48c] to-[#4f008c]">
          <div className="relative bg-[#0f0221] p-6 rounded-[14px]">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <span className="text-[#00c48c]">{toolName}</span> - Choose Account
              </h2>
              <button 
                onClick={onClose}
                className="p-1 hover:bg-white/10 rounded-lg transition-colors text-white/70 hover:text-white"
              >
                <X size={24} />
              </button>
            </div>

            {/* Accounts List */}
            <div className="space-y-3">
              {accounts.map((account, index) => (
                <button
                  key={account.tool_id}
                  onClick={() => {
                    onSelect(account.tool_id);
                    onClose();
                  }}
                  className="w-full group flex items-center justify-between p-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/15 transition-all duration-300 hover:border-[#00c48c]/50 hover:scale-[1.02]"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-[#00c48c]/20 flex items-center justify-center text-[#00c48c] group-hover:bg-[#00c48c] group-hover:text-white transition-all">
                      <User size={20} />
                    </div>
                    <div className="text-start">
                      <p className="font-bold text-white uppercase leading-none mb-1">
                         Access Account {index + 1}
                      </p>
                      <p className="text-white/50 text-xs">Click to launch session</p>
                    </div>
                  </div>
                  <ChevronRight size={18} className="text-white/30 group-hover:text-[#00c48c] transition-all" />
                </button>
              ))}
            </div>

            {/* <p className="mt-6 text-center text-white/40 text-[10px] uppercase tracking-widest font-bold">
              Premium Multi-Account System
            </p> */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MultiAccountModal;
