export type ModalProps = {
  open: boolean;
  onClose: () => void;
  additionalProps?: {
    [key: string]: any;
  };
};
