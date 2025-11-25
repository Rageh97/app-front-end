import { Dialog } from "@headlessui/react";
import AlertIcon from "../svg/AlertIcon";
import ModalActionButton from "../buttons/ModalActionButton";

interface ToolErrorModalProps {
  title?: string;
  modalOpen: boolean;
  setModalOpen: Function;
  message: string;
}

const ToolErrorModal: React.FC<
  ToolErrorModalProps & { setModalOpen: Function }
> = ({ modalOpen, setModalOpen, message, title }) => {
  return (
    <Dialog
      open={modalOpen}
      onClose={() => {
        setModalOpen(false);
      }}
      className="fixed top-0 left-0 z-99999 flex h-full min-h-screen w-full items-center justify-center bg-black/90 px-4 py-5"
    >
      <Dialog.Panel className="w-full max-w-[600px] h-[315px] text-center">
        <div className="relative p-8 flex flex-col items-center overflow-hidden w-full h-full rounded-lg bg-white">
          <div
            className="absolute top-4 right-4 cursor-pointer"
            onClick={() => {
              setModalOpen(false);
            }}
          >
            <img src="/images/close.png" className="max-w-4" alt="close" />
          </div>
          <span className="mx-auto inline-block">
            <AlertIcon />
          </span>
          <Dialog.Title className="mt-5.5 pb-2 text-lg font-bold text-black dark:text-white">
            {title ? title : "UNABLE TO LAUNCH THIS APP"}
          </Dialog.Title>
          <div className="mb-10">
            <p>{message}</p>
          </div>
          <div className="w-full px-3 2xsm:w-1/2">
            <ModalActionButton
              onClick={() => {
                setModalOpen(false);
              }}
              actionType="ACKNOWLEDGE"
              className="w-full border-1 border-[#374be4]"
            >
              I understand
            </ModalActionButton>
          </div>
        </div>
      </Dialog.Panel>
    </Dialog>
  );
};

export default ToolErrorModal;
