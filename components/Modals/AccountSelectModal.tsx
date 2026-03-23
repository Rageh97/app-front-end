"use client";
import React, { FunctionComponent } from "react";
import { Dialog } from "@headlessui/react";
import { X, UserRound, ArrowRight } from "lucide-react";
import { fullDateTimeFormat } from "@/utils/timeFormatting";

interface AccountEntry {
  tool_id: number;
  tool_name: string;
  endedAt: string;
  users_tools_id?: number;
  [key: string]: any;
}

interface AccountSelectModalProps {
  open: boolean;
  onClose: () => void;
  toolName: string;
  toolImage?: string;
  accounts: AccountEntry[];
  onSelectAccount: (toolId: number, accountId?: number) => void;
  activeApp: number | null;
  isLoaded: boolean | null;
}

const AccountSelectModal: FunctionComponent<AccountSelectModalProps> = ({
  open,
  onClose,
  toolName,
  toolImage,
  accounts,
  onSelectAccount,
  activeApp,
  isLoaded,
}) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      className="fixed inset-0 z-[999999] flex items-center justify-center"
    >
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" aria-hidden="true" onClick={onClose} />

      <Dialog.Panel className="relative w-full max-w-md mx-4 overflow-hidden">
        {/* Glow effect */}
        <div className="absolute -inset-1 bg-gradient-to-r from-[#4f008c] via-[#00c48c] to-[#4f008c] rounded-3xl opacity-60 blur-lg animate-pulse" />

        <div className="relative bg-[#0f0221] rounded-2xl border border-white/10 shadow-2xl">
          {/* Header */}
          <div className="relative p-6 pb-4">
            {/* Background glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 bg-[#4f008c]/30 blur-[80px] rounded-full pointer-events-none" />

            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-all duration-300 border border-white/5 hover:border-white/20 z-10"
            >
              <X size={18} />
            </button>

            {/* Tool image */}
            {toolImage && (
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-[#4f008c]/50 shadow-[0_0_20px_rgba(79,0,140,0.3)]">
                  <img
                    src={toolImage}
                    alt={toolName}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            )}

            <Dialog.Title className="text-xl font-black text-white text-center tracking-tight">
              {toolName}
            </Dialog.Title>
            <p className="text-white/50 text-sm text-center mt-1">
              Select which account to access
            </p>
          </div>

          {/* Divider */}
          <div className="mx-6 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent" />

          {/* Account buttons */}
          <div className="p-6 pt-4 space-y-3 max-h-[60vh] overflow-y-auto custom-scrollbar">
            {accounts.map((account, index) => {
              // The account button should show loading if its specific ID is active
              const isActive = activeApp === account.tool_id && isLoaded === null;
              const isSuccess = activeApp === account.tool_id && isLoaded === true;
              const isFailed = activeApp === account.tool_id && isLoaded === false;

              const accButtonId = account.tool_id.toString().replace(/[^a-zA-Z0-9]/g, '') + 'Cookies';

              return (
                <button
                  key={account.users_tools_id || `${account.tool_id}-${index}`}
                  id={accButtonId}
                  onClick={() => onSelectAccount(account.parent_tool_id || account.tool_id, account.tool_id)}
                  disabled={isActive}
                  className={`
                    group w-full flex items-center gap-4 p-4 rounded-xl
                    transition-all duration-300
                    ${isSuccess
                      ? "bg-[#00c48c]/20 border-[#00c48c]/50 border shadow-[0_0_15px_rgba(0,196,140,0.2)]"
                      : isFailed
                        ? "bg-red-500/20 border-red-500/50 border shadow-[0_0_15px_rgba(239,68,68,0.2)]"
                        : "bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[#4f008c]/50 hover:shadow-[0_0_20px_rgba(79,0,140,0.2)]"
                    }
                    ${isActive ? "animate-pulse" : ""}
                  `}
                >
                  {/* Account icon */}
                  <div className={`
                    flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center
                    transition-all duration-300
                    ${isSuccess
                      ? "bg-[#00c48c]/30 text-[#00c48c]"
                      : isFailed
                        ? "bg-red-500/30 text-red-400"
                        : "bg-gradient-to-br from-[#4f008c]/40 to-[#190237] text-white group-hover:from-[#4f008c]/60"
                    }
                  `}>
                    {isActive ? (
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-r-transparent" />
                    ) : isSuccess ? (
                      <img src="/images/green-check.png" className="w-5 h-5" alt="success" />
                    ) : isFailed ? (
                      <img src="/images/red-reload.png" className="w-5 h-5" alt="failed" />
                    ) : (
                      <UserRound size={22} />
                    )}
                  </div>

                  {/* Account info */}
                  <div className="flex-1 text-start">
                    <p className="text-white font-bold text-base">
                      Access Account {index + 1}
                    </p>
                    <p className="text-white/40 text-xs mt-0.5">
                      Expires: {fullDateTimeFormat(account.endedAt)}
                    </p>
                  </div>

                  {/* Arrow */}
                  <ArrowRight
                    size={18}
                    className="text-white/30 group-hover:text-[#00c48c] group-hover:translate-x-1 transition-all duration-300 flex-shrink-0"
                  />
                </button>
              );
            })}
          </div>
        </div>
      </Dialog.Panel>
    </Dialog>
  );
};

export default AccountSelectModal;
