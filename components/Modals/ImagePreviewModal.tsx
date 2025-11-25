import React, { FunctionComponent } from "react";
import { Dialog } from "@headlessui/react";
import { ModalProps } from "@/types/modal-props";

const ImagePreviewModal: FunctionComponent<ModalProps> = ({ open, onClose, additionalProps }) => {
  const url: string | undefined = additionalProps?.url;
  const isPdf: boolean = !!additionalProps?.isPdf;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      className="fixed top-0 left-0 z-999999 flex h-full min-h-screen w-full items-center justify-center bg-black/90 px-4 py-5"
    >
      <Dialog.Panel className="w-full max-w-[90vw] max-h-[90vh] rounded-2xl overflow-hidden bg-white dark:bg-boxdark">
        <div className="relative w-full h-full">
          <button
            className="absolute z-10 top-3 right-3 bg-white/90 dark:bg-boxdark text-black dark:text-white rounded-full px-3 py-1 text-sm shadow"
            onClick={onClose}
          >
            ✕
          </button>

          {isPdf ? (
            <iframe
              src={url}
              className="w-[90vw] h-[90vh]"
              title="Payment proof PDF"
            />
          ) : (
            <div className="flex items-center justify-center bg-black">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={url}
                alt="Payment proof"
                className="max-w-[90vw] max-h-[90vh] object-contain"
              />
            </div>
          )}
        </div>
      </Dialog.Panel>
    </Dialog>
  );
};

export default ImagePreviewModal;


























