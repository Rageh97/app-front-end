import React, { FunctionComponent, PropsWithChildren } from "react";
import { Dialog } from "@headlessui/react";
import AlertIcon from "@/components/svg/AlertIcon";
import ModalActionButton from "@/components/buttons/ModalActionButton";
import { useTranslation } from "react-i18next";

type ModalProps = {
  open: boolean;
  onClose: () => void;
  modalTitle: string;
  cancelButtonText?: string;
  confirmButtonText?: string;
  onCancel?: () => void;
  onConfirm?: () => void;
};

const Modal: FunctionComponent<PropsWithChildren<ModalProps>> = ({
  open,
  onClose,
  modalTitle,
  children,
  cancelButtonText,
  confirmButtonText,
  onCancel,
  onConfirm,
}) => {
  const { t } = useTranslation();
  return (
    <Dialog
      open={open}
      onClose={onClose}
      className="fixed top-0 left-0 z-999999 flex h-full min-h-screen w-full items-center justify-center bg-black/90 px-4 py-5"
    >
      <Dialog.Panel className="w-full max-w-142.5 rounded-lg bg-white py-12 px-8 text-center dark:bg-boxdark md:py-15 md:px-17.5">
        <span className="mx-auto inline-block">
          <AlertIcon />
        </span>
        <Dialog.Title className="mt-5.5 pb-2 text-xl font-bold text-black dark:text-white sm:text-2xl">
          {modalTitle}
        </Dialog.Title>
        <div className="mb-10">{children}</div>
        <div className="-mx-3 flex flex-wrap gap-y-4">
          <div className="w-full px-3 2xsm:w-1/2">
            <ModalActionButton
              onClick={() => {
                onClose?.();
                onCancel?.();
              }}
              actionType="CANCEL"
              className="w-full"
            >
              {cancelButtonText ?? t("orders.cancel")}
            </ModalActionButton>
          </div>
          <div className="w-full px-3 2xsm:w-1/2">
            <ModalActionButton
              onClick={() => {
                onClose?.();
                onConfirm?.();
              }}
              actionType="DANGER"
              className="w-full"
            >
              {confirmButtonText ?? t("orders.confirm")}
            </ModalActionButton>
          </div>
        </div>
      </Dialog.Panel>
    </Dialog>
  );
};

export default Modal;
