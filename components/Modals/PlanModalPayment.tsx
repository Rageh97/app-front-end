import { Dialog } from "@headlessui/react";
import LoadingButton from "../LoadingButton";
import { Tab } from "@headlessui/react";
import { Fragment } from "react";
import PlanCihBankPayment from "../Payments/PlanLocalBankPayment";
import PlanLocalBankPayment from "../Payments/PlanLocalBankPayment";

type Plans = "standard" | "premium" | "vip";

interface ToolModalPaymentProps {
  amount: number;
  plan: Plans;
  modalOpen?: boolean;
  setModalOpen?: Function;
  onBuySuccess?: Function;
}

const PlanModalPayment: React.FC<
  ToolModalPaymentProps & { setModalOpen: Function; onBuySuccess: Function }
> = ({ modalOpen, setModalOpen, plan, amount, onBuySuccess }) => {
  return (
    <Dialog
      open={modalOpen}
      onClose={() => {
        setModalOpen(false);
      }}
      className="fixed top-0 left-0 z-99999 flex h-full min-h-screen w-full items-center justify-center bg-black/90 px-4 py-5"
    >
      <Dialog.Panel className="w-full max-w-[830px] h-[400px] text-center">
        <div className="relative overflow-hidden w-full h-full rounded-lg bg-white">
          <Tab.Group>
            <div
              className="absolute z-999999 top-4 right-4 cursor-pointer"
              onClick={() => {
                setModalOpen(false);
              }}
            >
              <img src="/images/close.png" className="max-w-4" alt="close" />
            </div>
            <div className="flex bg-white w-full h-full">
              {/* Vertical Tab List */}
              <Tab.List className="flex flex-col justify-center items-center border-r-2 border-[#dcdcdc] shadow-1xl bg-[#F7FAF9] w-[25%]">
                <Tab className="w-full h-[25%] outline-none">
                  {({ selected }) => (
                    <button
                      className={
                        selected
                          ? "bg-white w-[95%] h-[89%] rounded-2xl shadow-lg border-[2px] border-[#dcdcdc]"
                          : "w-[95%] h-[89%]"
                      }
                    >
                      <span className="w-full h-full flex justify-center items-center">
                        <img
                          src="/images/cih-bank.png"
                          className="max-w-[120px]"
                          alt="cih"
                        />
                      </span>
                    </button>
                  )}
                </Tab>
                <Tab className="w-full h-[25%] outline-none">
                  {({ selected }) => (
                    <button
                      className={
                        selected
                          ? "bg-white w-[95%] h-[89%] rounded-2xl shadow-lg border-[2px] border-[#dcdcdc]"
                          : "w-[95%] h-[89%]"
                      }
                    >
                      <span className="w-full h-full flex justify-center items-center">
                        <img
                          src="/images/wafabank.png"
                          className="max-w-[110px]"
                          alt="wafabank"
                        />
                      </span>
                    </button>
                  )}
                </Tab>
                <Tab className="w-full h-[25%] outline-none">
                  {({ selected }) => (
                    <button
                      className={
                        selected
                          ? "bg-white w-[95%] h-[89%] rounded-2xl shadow-lg border-[2px] border-[#dcdcdc]"
                          : "w-[95%] h-[89%]"
                      }
                    >
                      <span className="w-full h-full flex justify-center items-center">
                        <img
                          src="/images/paypal.png"
                          className="max-w-[120px]"
                          alt="paypal"
                        />
                      </span>
                    </button>
                  )}
                </Tab>
                <Tab className="w-full h-[25%] outline-none">
                  {({ selected }) => (
                    <button
                      className={
                        selected
                          ? "bg-white w-[95%] h-[89%] rounded-2xl shadow-lg border-[2px] border-[#dcdcdc]"
                          : "w-[95%] h-[89%]"
                      }
                    >
                      <span className="w-full h-full flex justify-center items-center">
                        <img
                          src="/images/orange-money.png"
                          className="max-w-[120px]"
                          alt="orange-money"
                        />
                      </span>
                    </button>
                  )}
                </Tab>
                <Tab className="w-full h-[25%] outline-none">
                  {({ selected }) => (
                    <button
                      className={
                        selected
                          ? "bg-white w-[95%] h-[89%] rounded-2xl shadow-lg border-[2px] border-[#dcdcdc]"
                          : "w-[95%] h-[89%]"
                      }
                    >
                      <span className="w-full h-full flex justify-center items-center">
                        <img
                          src="/images/visa-master.png"
                          className="max-w-[120px]"
                          alt="visa-master"
                        />
                      </span>
                    </button>
                  )}
                </Tab>
              </Tab.List>

              {/* Tab Panels */}
              <Tab.Panels className="w-[75%] h-full">
                <Tab.Panel className="h-full">
                  <PlanLocalBankPayment
                    bankName="cih"
                    amount={amount}
                    plan={plan}
                    setModalOpen={() => {
                      onBuySuccess("cih");
                    }}
                  />
                </Tab.Panel>
                <Tab.Panel className="h-full">
                  <PlanLocalBankPayment
                    bankName="tijari"
                    amount={amount}
                    plan={plan}
                    setModalOpen={() => {
                      onBuySuccess("tijari");
                    }}
                  />
                </Tab.Panel>
                <Tab.Panel className="h-full gap-2 flex flex-col justify-center items-center">
                  <img
                    src="/images/paypal.png"
                    className="max-w-[100px]"
                    alt="CIH BANK"
                  />
                  <p className="text-sm text-black">Coming Soon ...</p>
                </Tab.Panel>
                <Tab.Panel className="h-full gap-2 flex flex-col justify-center items-center">
                  <img
                    src="/images/orange-money.png"
                    className="max-w-[100px]"
                    alt="CIH BANK"
                  />
                  <p className="text-sm text-black">Coming Soon ...</p>
                </Tab.Panel>
                <Tab.Panel className="h-full gap-2 flex flex-col justify-center items-center">
                  <img
                    src="/images/visa-master.png"
                    className="max-w-[100px]"
                    alt="CIH BANK"
                  />
                  <p className="text-sm text-black">Coming Soon ...</p>
                </Tab.Panel>
              </Tab.Panels>
            </div>
          </Tab.Group>
        </div>
      </Dialog.Panel>
    </Dialog>
  );
};

export default PlanModalPayment;
