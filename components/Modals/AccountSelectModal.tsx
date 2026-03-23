"use client";
import { Dialog, Transition } from "@headlessui/react";
import { Fragment } from "react";
import { X, User, Zap } from "lucide-react";

interface AccountEntry {
  users_tools_id: number;
  endedAt: string;
  accountIndex: number;
}

interface AccountSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  toolName: string;
  accounts: AccountEntry[];
  onSelect: (account: AccountEntry) => void;
}

const AccountSelectModal: React.FC<AccountSelectModalProps> = ({
  isOpen,
  onClose,
  toolName,
  accounts,
  onSelect,
}) => {
  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-[110001]" onClose={onClose}>
        {/* Backdrop */}
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-6 scale-95"
              enterTo="opacity-100 translate-y-0 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 scale-100"
              leaveTo="opacity-0 translate-y-6 scale-95"
            >
              <Dialog.Panel className="relative w-full max-w-md overflow-hidden rounded-2xl border border-white/10 bg-[#0f0221] shadow-[0_25px_60px_rgba(79,0,140,0.4)] text-center">
                {/* Purple gradient top bar */}
                <div className="h-1 w-full bg-gradient-to-r from-[#4f008c] via-[#7c3aed] to-[#4f008c]" />

                {/* Close button */}
                <button
                  onClick={onClose}
                  className="absolute right-4 top-4 text-white/30 hover:text-white transition-colors duration-200 z-10"
                >
                  <X size={20} />
                </button>

                {/* Icon */}
                <div className="mt-8 mb-4 flex justify-center">
                  <div className="relative">
                    <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-[#4f008c]/40 to-[#7c3aed]/40 border border-purple-500/30 flex items-center justify-center shadow-[0_0_20px_rgba(124,58,237,0.2)]">
                      <Zap size={28} className="text-purple-400" />
                    </div>
                    <div className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-[#4f008c] border-2 border-[#0f0221] flex items-center justify-center">
                      <span className="text-[10px] text-white font-black">{accounts.length}</span>
                    </div>
                  </div>
                </div>

                {/* Title */}
                <div className="px-8 pb-2">
                  <Dialog.Title
                    as="h3"
                    className="text-xl font-black text-white leading-tight"
                  >
                    {toolName}
                  </Dialog.Title>
                  <p className="mt-2 text-sm text-white/50">
                    Select the account you want to access
                  </p>
                </div>

                {/* Divider */}
                <div className="mx-8 my-5 h-px bg-white/5" />

                {/* Account Buttons */}
                <div className="px-8 pb-8 flex flex-col gap-3">
                  {accounts.map((account) => (
                    <button
                      key={account.users_tools_id}
                      onClick={() => {
                        onSelect(account);
                        onClose();
                      }}
                      className="group relative w-full flex items-center gap-4 px-5 py-4 rounded-xl border border-white/10 bg-white/5 hover:bg-purple-600/20 hover:border-purple-500/50 transition-all duration-300 hover:shadow-[0_0_15px_rgba(124,58,237,0.15)] active:scale-[0.98]"
                    >
                      {/* Account icon */}
                      <div className="h-10 w-10 shrink-0 rounded-xl bg-gradient-to-br from-[#4f008c]/50 to-[#7c3aed]/50 border border-purple-500/30 flex items-center justify-center group-hover:shadow-[0_0_10px_rgba(124,58,237,0.3)] transition-all duration-300">
                        <User size={18} className="text-purple-300" />
                      </div>

                      {/* Label */}
                      <div className="flex-1 text-left">
                        <p className="font-bold text-white text-sm">
                          Account {account.accountIndex}
                        </p>
                        <p className="text-xs text-white/40 mt-0.5">
                          Expires:{" "}
                          {new Date(account.endedAt).toLocaleDateString("en-GB", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </p>
                      </div>

                      {/* Arrow */}
                      <div className="text-white/20 group-hover:text-purple-400 transition-colors duration-200">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                          <path
                            d="M6 12L10 8L6 4"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </div>
                    </button>
                  ))}
                </div>

                {/* Cancel */}
                <div className="px-8 pb-7">
                  <button
                    onClick={onClose}
                    className="w-full py-3 text-sm text-white/40 hover:text-white/70 transition-colors duration-200"
                  >
                    Cancel
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
};

export default AccountSelectModal;
