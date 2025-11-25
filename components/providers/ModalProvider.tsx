"use client";

import React, {
  FunctionComponent,
  PropsWithChildren,
  useCallback,
  useContext,
  useState,
} from "react";
import { ModalProps } from "@/types/modal-props";

const ModalContext = React.createContext({
  OpenedModal: null,
  modals: [],
  push: (modal: FunctionComponent<ModalProps>) => {},
  pop: () => {},
  removeModal: (modal: FunctionComponent<ModalProps>) => {},
});

const ModalProvider: FunctionComponent<PropsWithChildren> = (props) => {
  const [OpenedModal, setOpenedModal] =
    useState<FunctionComponent<ModalProps>>(null);
  const [modals, setModals] = useState<FunctionComponent<ModalProps>[]>([]);
  const push = useCallback(
    (modal: FunctionComponent) => {
      setModals((modals) => [...modals, modal]);
      setOpenedModal(() => modal);
    },
    [setModals, setOpenedModal]
  );
  const pop = useCallback(() => {
    setModals((modals) => {
      const newModals = modals.slice(0, modals.length - 1);
      if (newModals.length > 0) {
        setOpenedModal(() => newModals[newModals.length - 1]);
      } else {
        setOpenedModal(null);
      }
      return newModals;
    });
  }, [setModals, setOpenedModal]);
  const removeModal = useCallback(
    (modal: FunctionComponent) => {
      setModals((modals) => {
        const newModals = modals.filter((m) => m !== modal);
        if (newModals.length > 0) {
          setOpenedModal(() => newModals[newModals.length - 1]);
        } else {
          setOpenedModal(null);
        }
        return newModals;
      });
    },
    [setModals]
  );
  return (
    <ModalContext.Provider
      value={{
        OpenedModal,
        modals,
        push,
        pop,
        removeModal,
      }}
    >
      <>
        {props.children}
        {OpenedModal && <OpenedModal open={true} onClose={pop} />}
      </>
    </ModalContext.Provider>
  );
};

export default ModalProvider;

export function useModal(Modal: FunctionComponent<ModalProps>) {
  const { push, removeModal } = useContext(ModalContext);
  return {
    open: (additionalProps: { [key: string]: any }) => {
      const Component: FunctionComponent<ModalProps> = (props) => (
        <Modal {...props} additionalProps={additionalProps} />
      );
      push(Component);
      return () => removeModal(Component);
    },
  };
}
