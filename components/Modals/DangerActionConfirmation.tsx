import React, { FunctionComponent } from "react";
import { ModalProps } from "@/types/modal-props";
import WarningModal from "@/components/Modals/WarningModal";

type ConfigProps = {
  msg: string;
  title: string;
};

type AllProps = ConfigProps & ModalProps;

const DangerActionConfirmation: FunctionComponent<AllProps> = ({
  open,
  onClose,
  msg,
  title,
  additionalProps,
}) => {
  return (
    <WarningModal
      open={open}
      onClose={onClose}
      modalTitle={title}
      onCancel={additionalProps?.onCancel}
      onConfirm={additionalProps?.onConfirm}
    >
      <p>{msg}</p>
    </WarningModal>
  );
};

export default DangerActionConfirmation;

export function getDangerActionConfirmationModal(props: ConfigProps) {
  return (modalProps: ModalProps) => (
    <DangerActionConfirmation {...modalProps} {...props} />
  );
}
