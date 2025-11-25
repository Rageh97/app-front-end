import React, { FunctionComponent, PropsWithChildren } from "react";
import { Dialog } from "@headlessui/react";
import SmileyFace from "@/components/svg/SmileyFace";
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
      <Dialog.Panel className="relative w-full max-w-142.5 rounded-lg bg-primary py-12 px-8 text-center md:py-15 md:px-17.5">
        <span className="mx-auto inline-block">
          <SmileyFace />
        </span>
        <Dialog.Title className="mt-5.5 pb-2 text-xl font-bold text-white sm:text-4xl">
          {modalTitle}
        </Dialog.Title>
        <span className="mx-auto mb-6 inline-block h-1 w-22.5 rounded bg-primary"></span>
        <div className="mb-7.5">{children}</div>
        <div className="flex justify-center">
          <ModalActionButton actionType="ACKNOWLEDGE">
            Know More
          </ModalActionButton>
        </div>
      </Dialog.Panel>
    </Dialog>
  );
};

export default Modal;
