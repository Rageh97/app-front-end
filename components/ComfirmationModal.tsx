import AlertIcon from "./svg/AlertIcon";

interface ConfirmationModalProps {
  title: string;
  message: string;
  buttonMessage: string;
  modalOpen: any;
  setModalOpen: Function;
  action: Function;
  isLoading: boolean;
}

const ConfirmationModal: React.FC<
  ConfirmationModalProps & { setModalOpen: Function; action: Function }
> = ({
  title,
  message,
  buttonMessage,
  modalOpen,
  setModalOpen,
  action,
  isLoading,
}) => {
  return (
    <div>
      <div
        className={`fixed top-0 left-0 z-999999 flex h-full min-h-screen w-full items-center justify-center bg-black/90 px-4 py-5 ${
          modalOpen ? "block" : "hidden"
        }`}
      >
        <div
          onFocus={() => setModalOpen(true)}
          onBlur={() => setModalOpen(false)}
          className="w-full max-w-142.5 rounded-lg bg-white py-12 px-8 text-center dark:bg-boxdark md:py-15 md:px-17.5"
        >
          <span className="mx-auto inline-block">
            <AlertIcon />
          </span>
          <h3 className="mt-5.5 pb-2 text-xl font-bold text-black dark:text-white sm:text-2xl">
            {title}
          </h3>
          <p className="mb-10">{message}</p>
          <div className="-mx-3 flex flex-wrap gap-y-4">
            <div className="w-full px-3 2xsm:w-1/2">
              <button
                disabled={isLoading}
                onClick={() => setModalOpen(false)}
                className="block w-full rounded border border-stroke bg-gray p-3 text-center font-medium text-black transition hover:border-black hover:bg-black hover:text-white dark:border-strokedark dark:bg-meta-4 dark:text-white dark:hover:border-black dark:hover:bg-black"
              >
                إلغاء
              </button>
            </div>
            <div className="w-full px-3 2xsm:w-1/2">
              <button
                disabled={isLoading}
                onClick={async () => {
                  try {
                    await action();
                    setModalOpen(false);
                  } catch (error) {
                    console.error('Error in action:', error);
                  }
                }}
                className="block w-full rounded border border-meta-1 bg-meta-1 p-3 text-center font-medium text-white transition hover:bg-opacity-90"
              >
                {!isLoading ? (
                  buttonMessage
                ) : (
                  <div className="inline-block h-[1.23rem] w-[1.23rem] animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
