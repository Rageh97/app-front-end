import { Dialog, Transition } from "@headlessui/react";
import { Fragment } from "react";
import { X, Users, LogIn } from "lucide-react";
import { checkIfImageUrl } from "@/utils/imageValidator";

interface AccountInfo {
  tool_id: number;
  tool_name: string;
  tool_image?: string;
  endedAt?: string;
  accountIndex: number; // 1-based index
  tag?: string;
  buttonId?: string;
}

interface AccountSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  toolName: string;
  toolImage?: string;
  accounts: AccountInfo[];
  onSelectAccount: (toolId: number) => void;
  isLoading?: boolean;
}

const AccountSelectionModal: React.FC<AccountSelectionModalProps> = ({
  isOpen,
  onClose,
  toolName,
  toolImage,
  accounts,
  onSelectAccount,
  isLoading,
}) => {
  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-[110000]" onClose={onClose}>
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
          <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform overflow-hidden rounded-2xl bg-[#1a1129] border border-white/10 px-6 py-8 md:px-8 md:py-10 text-center shadow-[0_20px_50px_rgba(0,0,0,0.5)] transition-all w-full max-w-md">
                
                {/* Background Glow Effects */}
                <div className="absolute -top-20 -left-20 w-40 h-40 bg-purple-600/15 blur-[80px] rounded-full pointer-events-none"></div>
                <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-[#00c48c]/10 blur-[80px] rounded-full pointer-events-none"></div>

                {/* Close Button */}
                <button
                  onClick={onClose}
                  className="absolute right-4 top-4 text-white/30 hover:text-white transition-colors z-10"
                >
                  <X size={20} />
                </button>

                {/* Tool Image */}
                {toolImage && checkIfImageUrl(toolImage) && (
                  <div className="mx-auto w-16 h-16 rounded-2xl overflow-hidden border-2 border-purple-500/30 shadow-[0_0_20px_rgba(147,51,234,0.2)] mb-4">
                    <img
                      src={toolImage}
                      alt={toolName}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                {/* Icon */}
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-purple-500/10 border border-purple-500/20 mb-5">
                  <Users size={28} className="text-purple-400" />
                </div>

                {/* Title */}
                <Dialog.Title as="h3" className="text-xl font-black text-white mb-2 leading-tight">
                  {toolName}
                </Dialog.Title>
                
                <p className="text-white/50 text-sm mb-6">
                  Select which account you want to access
                </p>

                {/* Account Buttons */}
                <div className="flex flex-col gap-3">
                  {accounts.map((account) => (
                    <button
                      key={account.tool_id}
                      id={account.buttonId}
                      onClick={() => {
                        onSelectAccount(account.tool_id);
                        setTimeout(() => onClose(), 800);
                      }}
                      disabled={isLoading}
                      className="tool-btn group relative w-full flex items-center gap-4 px-5 py-4 bg-white/[0.03] hover:bg-gradient-to-r hover:from-purple-600/20 hover:to-[#00c48c]/20 border border-white/10 hover:border-purple-500/40 rounded-xl text-white font-semibold text-sm transition-all duration-300 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden"
                    >
                      {/* Hover Glow */}
                      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-r from-purple-500/5 to-[#00c48c]/5 pointer-events-none"></div>
                      
                      {/* Account Number Badge */}
                      <div className="relative flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-[#00c48c] flex items-center justify-center shadow-[0_0_15px_rgba(147,51,234,0.3)] group-hover:shadow-[0_0_25px_rgba(147,51,234,0.5)] transition-shadow duration-300">
                        <span className="text-white font-black text-lg">{account.accountIndex}</span>
                      </div>

                      {/* Account Label */}
                      <div className="relative flex-1 text-left">
                        <span className="text-white font-bold text-base">
                          {account.tag ? account.tag : `Access Account ${account.accountIndex}`}
                        </span>
                      </div>

                      {/* Arrow Icon */}
                      <LogIn size={18} className="relative text-white/30 group-hover:text-[#00c48c] transition-colors duration-300 group-hover:translate-x-0.5 transform" />
                    </button>
                  ))}
                </div>

                {/* Cancel Button */}
                <button
                  onClick={onClose}
                  className="w-full mt-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white/60 hover:text-white font-medium text-sm transition-all active:scale-95"
                >
                  Cancel
                </button>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
};

export default AccountSelectionModal;
