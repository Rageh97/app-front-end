import React, { FunctionComponent, PropsWithChildren, ReactNode } from "react";
import { Dialog } from "@headlessui/react";
import { ModalProps } from "@/types/modal-props";
import XMarkIcon from "@/components/icons/XMarkIcon";

type Props = PropsWithChildren<ModalProps> & {
  title: ReactNode;
};

const FormModal: FunctionComponent<Props> = ({
  open,
  onClose,
  children,
  title,
}) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      className="fixed top-0 left-0 z-99999 flex h-screen w-full justify-center overflow-y-scroll bg-black/80 py-5 px-4"
    >
      <Dialog.Panel className="relative m-auto w-full max-w-180 rounded-sm border border-stroke bg-gray p-4 pt-1 shadow-default dark:border-strokedark dark:bg-meta-4 sm:p-8 sm:pt-3 xl:p-10 xl:pt-5">
        <Dialog.Title className="pb-2 text-xl mb-10 font-bold text-black dark:text-white sm:text-2xl">
          {title}
        </Dialog.Title>
        <button
          onClick={onClose}
          className="absolute right-1 top-1 sm:right-5 sm:top-5"
        >
          <XMarkIcon className="w-8 h-8 stroke-2" />
        </button>
        {children}
      </Dialog.Panel>
    </Dialog>
  );
};

export default FormModal;
