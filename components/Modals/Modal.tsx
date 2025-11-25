import React, { FunctionComponent, PropsWithChildren } from "react";
import { Dialog } from "@headlessui/react";
import ModalActionButton from "@/components/buttons/ModalActionButton";

type ModalProps = {
  open: boolean;
  onClose: () => void;
  modalTitle: string;
};

const Modal: FunctionComponent<PropsWithChildren<ModalProps>> = ({
  open,
  onClose,
  modalTitle,
  children,
}) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      className="fixed top-0 left-0 z-999999 flex h-full min-h-screen w-full items-center justify-center bg-black/90 px-4 py-5"
    >
      <Dialog.Panel className="w-full max-w-142.5 rounded-lg bg-white py-12 px-8 text-center dark:bg-boxdark md:py-15 md:px-17.5">
        <Dialog.Title className="pb-2 text-xl font-bold text-black dark:text-white sm:text-2xl">
          {modalTitle}
        </Dialog.Title>
        <span className="mx-auto mb-6 inline-block h-1 w-22.5 rounded bg-primary"></span>
        <div className="mb-10">{children}</div>
        <div className="-mx-3 flex flex-wrap gap-y-4">
          <div className="w-full px-3 2xsm:w-1/2 flex">
            <ModalActionButton
              onClick={onClose}
              actionType="CANCEL"
              className="w-full"
            >
              Cancel
            </ModalActionButton>
          </div>
          <div className="w-full px-3 2xsm:w-1/2">
            <ModalActionButton actionType="CONFIRM" className="w-full">
              Confirm
            </ModalActionButton>
          </div>
        </div>
      </Dialog.Panel>
    </Dialog>
  );
};

export default Modal;
