import { Dialog, Transition } from "@headlessui/react";
import { Fragment } from "react";
import AlertIcon from "../svg/AlertIcon";
import ModalActionButton from "../buttons/ModalActionButton";
import { X, AlertTriangle } from "lucide-react";

interface ToolErrorModalProps {
  title?: string;
  modalOpen: boolean;
  setModalOpen: Function;
  message: string;
}

const ToolErrorModal: React.FC<ToolErrorModalProps> = ({ modalOpen, setModalOpen, message, title }) => {
  return (
    <Transition.Root show={modalOpen} as={Fragment}>
      <Dialog as="div" className="relative z-[110000]" onClose={() => setModalOpen(false)}>
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
              <Dialog.Panel className="relative transform overflow-hidden rounded-2xl bg-[#1a1129] border border-white/10 px-8 py-10 text-center shadow-[0_20px_50px_rgba(0,0,0,0.5)] transition-all w-full max-w-sm">
                
                {/* Close Button */}
                <button
                  onClick={() => setModalOpen(false)}
                  className="absolute right-4 top-4 text-white/20 hover:text-white transition-colors"
                >
                  <X size={20} />
                </button>

                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10 border border-red-500/20 mb-6">
                  <AlertTriangle size={32} className="text-red-500" />
                </div>

                <Dialog.Title as="h3" className="text-xl font-black text-white mb-2 leading-tight">
                  {title || "تنبيه هام"}
                </Dialog.Title>
                
                <div className="mb-8">
                  <p className="text-white/60 text-sm leading-relaxed whitespace-pre-wrap">
                    {message}
                  </p>
                </div>

                <button
                  onClick={() => setModalOpen(false)}
                  className="w-full py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white font-bold text-sm transition-all active:scale-95"
                >
                  حسناً، فهمت
                </button>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
};

export default ToolErrorModal;
