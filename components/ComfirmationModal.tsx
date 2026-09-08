import React from "react";
import AlertIcon from "./svg/AlertIcon";

interface ConfirmationModalProps {
  title: string;
  message: string;
  buttonMessage: string;
  modalOpen: any;
  setModalOpen: (open: boolean) => void;
  action: () => void | Promise<void>;
  isLoading: boolean;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  title,
  message,
  buttonMessage,
  modalOpen,
  setModalOpen,
  action,
  isLoading,
}) => {
  if (!modalOpen) return null;

  return (
    <div className="fixed inset-0 z-[999999] flex items-center justify-center bg-black/80 p-4">
      <div
        className="w-full max-w-md rounded-xl border border-white/10 bg-[#0F121C] p-6 text-center font-cairo"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-rose-500/10 border border-rose-500/20">
          <AlertIcon />
        </div>

        <h3 className="mb-2 text-base font-bold text-white">
          {title}
        </h3>

        <p className="mb-6 text-xs text-white/70 leading-relaxed">
          {message}
        </p>

        <div className="flex items-center gap-3">
          <button
            type="button"
            disabled={isLoading}
            onClick={() => setModalOpen(false)}
            className="flex-1 rounded-lg border border-white/10 bg-white/[0.04] py-2.5 px-4 text-xs font-semibold text-white/80 transition-colors hover:bg-white/[0.08] hover:text-white disabled:opacity-50"
          >
            إلغاء
          </button>

          <button
            type="button"
            disabled={isLoading}
            onClick={async () => {
              try {
                await action();
                setModalOpen(false);
              } catch (error) {
                console.error("Error in action:", error);
              }
            }}
            className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-rose-600 py-2.5 px-4 text-xs font-semibold text-white transition-colors hover:bg-rose-700 disabled:opacity-50"
          >
            {isLoading ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-solid border-white border-r-transparent" />
            ) : (
              <span>{buttonMessage}</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
