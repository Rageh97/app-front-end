import { Dialog } from "@headlessui/react";
import { NewToolsDto } from "@/types/tools/new-tools-dto";
import LoadingButton from "../LoadingButton";
import { Tab } from "@headlessui/react";
import { Fragment } from "react";
import ToolLocalBankPayment from "../Payments/ToolLocalBankPayment";
import OnlinePayment from "../Payments/OnlinePayment";
import OfflinePayment from "../Payments/OfflinePayment";
import { useTranslation } from "react-i18next";

type Period = "month" | "year" | "day";

interface PaymentModalProps {
  productId: number;
  productData: any;
  productType: "tool" | "pack" | "device" | "credits"
  modalOpen: boolean;
  period: Period;
  setModalOpen: Function;
  onBuySuccess: Function;
}

const PaymentModal: React.FC<
  PaymentModalProps & { setModalOpen: Function; onBuySuccess: Function }
> = ({ modalOpen, setModalOpen, period, productId, productData, productType, onBuySuccess }) => {
  const { t } = useTranslation();
  return (
    <Dialog
      open={modalOpen}
      onClose={() => {
        setModalOpen(false);
      }}
      className="fixed top-0 left-0 z-99999 flex h-full min-h-screen w-full items-center justify-center bg-black/90 px-4 py-5"
    >
      <Dialog.Panel className="w-full max-w-[700px] max-h-[90vh] overflow-y-auto text-center">
        <div className="relative bg-[linear-gradient(180deg,_#00c48c,_#4f008c)] overflow-hidden w-full rounded-2xl shadow-2xl">
          <Tab.Group>
            {/* Close Button */}
            <div
              className="absolute z-999999 top-4 right-4 cursor-pointer bg-white/20 backdrop-blur-sm rounded-full p-2 hover:bg-white/30 transition-colors"
              onClick={() => {
                setModalOpen(false);
              }}
            >
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>

            {/* Header */}
            <div className="px-6 py-4 text-white relative">
              <h3 className="text-xl font-bold">{t('offlinePayment.choosePaymentGate')}</h3>
            </div>

            <div className="px-4 pb-4">
              {/* Payment Methods Tab List */}
              <Tab.List className="grid grid-cols-3 lg:grid-cols-6 gap-2 mb-4">
                <Tab className="flex flex-col gap-2 justify-center items-center outline-none focus:outline-none">
                  {({ selected }) => (
                    <div className={`w-full flex flex-col items-center gap-2 p-3 rounded-xl transition-all duration-300 ${
                      selected 
                        ? 'bg-gradient-to-br from-orange to-orange-600 shadow-lg scale-105 border-2 border-orange' 
                        : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                    }`}>
                      <div className={`w-16 h-16 rounded-lg flex items-center justify-center transition-all ${
                        selected ? 'bg-white shadow-md' : 'bg-white'
                      }`}>
                        <img
                          src="https://www2.0zz0.com/2025/07/02/21/357173052.png"
                          className="w-10 h-10 object-contain"
                          alt="zain"
                        />
                      </div>
                      <p className={`text-xs font-semibold text-center ${
                        selected ? 'text-white' : 'text-white'
                      }`}>
                        زين كاش
                      </p>
                    </div>
                  )}
                </Tab>
                <Tab className="flex flex-col gap-2 justify-center items-center outline-none focus:outline-none">
                  {({ selected }) => (
                    <div className={`w-full flex flex-col items-center gap-2 p-3 rounded-xl transition-all duration-300 ${
                      selected 
                        ? 'bg-gradient-to-br from-orange to-orange-600 shadow-lg scale-105 border-2 border-orange' 
                        : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                    }`}>
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center transition-all ${
                        selected ? 'bg-white shadow-md' : 'bg-white'
                      }`}>
                        <img
                          src="https://stock-pik.com/tools/unnamed%20(2).webp"
                          className="w-10 h-10 object-contain"
                          alt="Alrafedeen"
                        />
                      </div>
                      <p className={`text-xs font-semibold text-center ${
                        selected ? 'text-white' : 'text-white'
                      }`}>
                        الرافدين
                      </p>
                    </div>
                  )}
                </Tab>
                <Tab className="flex flex-col gap-2 justify-center items-center outline-none focus:outline-none">
                  {({ selected }) => (
                    <div className={`w-full flex flex-col items-center gap-2 p-3 rounded-xl transition-all duration-300 ${
                      selected 
                        ? 'bg-gradient-to-br from-orange to-orange-600 shadow-lg scale-105 border-2 border-orange' 
                        : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                    }`}>
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center transition-all ${
                        selected ? 'bg-white shadow-md' : 'bg-white'
                      }`}>
                        <img
                          src="https://www2.0zz0.com/2025/07/02/21/255630149.png"
                          className="w-10 h-10 object-contain"
                          alt="AsiaPay"
                        />
                      </div>
                      <p className={`text-xs font-semibold text-center ${
                        selected ? 'text-white' : 'text-white'
                      }`}>
                        آسيا بي
                      </p>
                    </div>
                  )}
                </Tab>
                <Tab className="flex flex-col gap-2 justify-center items-center outline-none focus:outline-none">
                  {({ selected }) => (
                    <div className={`w-full flex flex-col items-center gap-2 p-3 rounded-xl transition-all duration-300 ${
                      selected 
                        ? 'bg-gradient-to-br from-orange to-orange-600 shadow-lg scale-105 border-2 border-orange' 
                        : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                    }`}>
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center transition-all ${
                        selected ? 'bg-white shadow-md' : 'bg-white'
                      }`}>
                        <img
                          src="https://www2.0zz0.com/2025/07/02/22/627573215.jpg"
                          className="w-10 h-10 object-contain"
                          alt="IraqBank"
                        />
                      </div>
                      <p className={`text-xs font-semibold text-center ${
                        selected ? 'text-white' : 'text-white'
                      }`}>
                        بنك العراق
                      </p>
                    </div>
                  )}
                </Tab>
                <Tab className="flex flex-col gap-2 justify-center items-center outline-none focus:outline-none">
                  {({ selected }) => (
                    <div className={`w-full flex flex-col items-center gap-2 p-3 rounded-xl transition-all duration-300 ${
                      selected 
                        ? 'bg-gradient-to-br from-orange to-orange-600 shadow-lg scale-105 border-2 border-orange' 
                        : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                    }`}>
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center transition-all ${
                        selected ? 'bg-white shadow-md' : 'bg-white'
                      }`}>
                        <img
                          src="https://stock-pik.com/tools/unnamed%20(3).png"
                          className="w-10 h-10 object-contain"
                          alt="FastPay"
                        />
                      </div>
                      <p className={`text-xs font-semibold text-center ${
                        selected ? 'text-white' : 'text-white'
                      }`}>
                        فاست بي
                      </p>
                    </div>
                  )}
                </Tab>
                <Tab className="flex flex-col gap-2 justify-center items-center outline-none focus:outline-none">
                  {({ selected }) => (
                    <div className={`w-full flex flex-col items-center gap-2 p-3 rounded-xl transition-all duration-300 ${
                      selected 
                        ? 'bg-gradient-to-br from-orange to-orange-600 shadow-lg scale-105 border-2 border-orange' 
                        : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                    }`}>
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center transition-all ${
                        selected ? 'bg-white shadow-md' : 'bg-white'
                      }`}>
                        <img
                          src="https://www2.0zz0.com/2025/07/02/22/684653137.png"
                          className="w-10 h-10 object-contain"
                          alt="AsiaSel"
                        />
                      </div>
                      <p className={`text-xs font-semibold text-center ${
                        selected ? 'text-white' : 'text-white'
                      }`}>
                        اسياسيل
                      </p>
                    </div>
                  )}
                </Tab>
              </Tab.List>

              {/* Tab Panels */}
              <Tab.Panels className="w-full">
                <Tab.Panel className="w-full">
                  <div className="bg-[#19023780] rounded-xl p-4 border-2 border-orange">
                    <OfflinePayment
                      paymentMethod="Zain"
                      period={period}
                      productType={productType}
                      productData={productData}
                      productId={productId}
                      setDetailsModalOpen={() => {
                        onBuySuccess("Zain");
                      }}
                    />
                  </div>
                </Tab.Panel>
                <Tab.Panel className="w-full">
                  <div className="bg-[#19023780] rounded-xl p-4 border-2 border-orange">
                    <OfflinePayment
                      paymentMethod="Alrafedeen"
                      period={period}
                      productType={productType}
                      productData={productData}
                      productId={productId}
                      setDetailsModalOpen={() => {
                        onBuySuccess("Alrafedeen");
                      }}
                    />
                  </div>
                </Tab.Panel>
                <Tab.Panel className="w-full">
                  <div className="bg-[#19023780] rounded-xl p-4 border-2 border-orange">
                    <OfflinePayment
                      paymentMethod="AsiaPay"
                      period={period}
                      productType={productType}
                      productData={productData}
                      productId={productId}
                      setDetailsModalOpen={() => {
                        onBuySuccess("AsiaPay");
                      }}
                    />
                  </div>
                </Tab.Panel>
                <Tab.Panel className="w-full">
                  <div className="bg-[#19023780] rounded-xl p-4 border-2 border-orange">
                    <OfflinePayment
                      paymentMethod="IraqBank"
                      period={period}
                      productType={productType}
                      productData={productData}
                      productId={productId}
                      setDetailsModalOpen={() => {
                        onBuySuccess("IraqBank");
                      }}
                    />
                  </div>
                </Tab.Panel>
                <Tab.Panel className="w-full">
                  <div className="bg-[#19023780] rounded-xl p-4 border-2 border-orange">
                    <OfflinePayment
                      paymentMethod="FastPay"
                      period={period}
                      productType={productType}
                      productData={productData}
                      productId={productId}
                      setDetailsModalOpen={() => {
                        onBuySuccess("FastPay");
                      }}
                    />
                  </div>
                </Tab.Panel>
                <Tab.Panel className="w-full">
                  <div className="bg-[#19023780] rounded-xl p-4 border-2 border-orange">
                    <OfflinePayment
                      paymentMethod="AsiaSel"
                      period={period}
                      productType={productType}
                      productData={productData}
                      productId={productId}
                      setDetailsModalOpen={() => {
                        onBuySuccess("AsiaSel");
                      }}
                    />
                  </div>
                </Tab.Panel>

              </Tab.Panels>
            </div>
          </Tab.Group>
        </div>
      </Dialog.Panel>
    </Dialog>
  );
};

export default PaymentModal;
