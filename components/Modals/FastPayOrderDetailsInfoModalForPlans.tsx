import React, { useEffect } from 'react';
import { Dialog } from "@headlessui/react";
import { useTranslation } from 'react-i18next';

interface FastPayOrderDetailsInfoModalPlansProps {
  modalOpen: boolean;
  packDetails: any;
  setModalOpen: Function;
}

const FastPayOrderDetailsInfoModalForPlans: React.FC<
FastPayOrderDetailsInfoModalPlansProps
> = ({ modalOpen, setModalOpen, packDetails }) => {
  // Debug log when component renders or packDetails changes
  useEffect(() => {
    console.log('Fast Pay Modal - packDetails:', {
      period: packDetails?.period,
      monthly_price: packDetails?.monthly_price,
      yearly_price: packDetails?.yearly_price,
      isDevice: packDetails?.isDevice,
      quantity: packDetails?.quantity,
      pack_name: packDetails?.pack_name,
      fullDetails: JSON.parse(JSON.stringify(packDetails || {}))
    });
    
    // Log the calculated price whenever packDetails changes
    if (packDetails) {
      const price = calculatePrice();
    
    }
  }, [packDetails]);
  const { t } = useTranslation();
  
  // Calculate the price based on period
  const calculatePrice = () => {
    if (!packDetails) return 0;
    
    // For devices, use the device-specific pricing
    if (packDetails.isDevice) {
      return packDetails.total_price_mad || (packDetails.monthly_price * (packDetails.quantity || 1) * 10);
    }
    
    // Convert string prices to numbers if they're strings
    const monthlyPrice = typeof packDetails.monthly_price === 'string' 
      ? parseFloat(packDetails.monthly_price) 
      : packDetails.monthly_price || 0;
      
    const yearlyPrice = typeof packDetails.yearly_price === 'string'
      ? parseFloat(packDetails.yearly_price)
      : packDetails.yearly_price || 0;
    
    // Determine which price to use based on period
    const isYearly = packDetails.period === 'year';
    const price = isYearly ? yearlyPrice : monthlyPrice;
    
    // Log for debugging
   
    
    return price * 10; // Multiply by 10 for MAD conversion
  };
  
  const displayPrice = calculatePrice();

  return (
    <Dialog
      open={modalOpen}
      onClose={() => {
        setModalOpen(false);
      }}
      className="fixed top-0 left-0 z-999999 flex h-full min-h-screen w-full items-center justify-center bg-black/90 px-4 py-5"
    >
      <Dialog.Panel className="w-full max-w-[500px] text-center">
        <div className="flex flex-col overflow-hidden w-full rounded-2xl bg-white shadow-2xl relative">
          {/* Close Button */}
          <div
            className="absolute z-999999 top-4 right-4 cursor-pointer bg-white rounded-full p-2 shadow-lg hover:bg-gray-100 transition-colors"
            onClick={() => {
              setModalOpen(false);
            }}
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>

          {/* Header Section */}
          <div className="bg-gradient-to-br from-[#00c48c] to-[#4f008c] px-8 py-6 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-center mb-3">
                <div className="bg-white/20 backdrop-blur-sm rounded-full p-3">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <h2 className="text-2xl font-bold mb-2">{t('bankDetails.orderSubmitted')}</h2>
              {/* <p className="text-white/90 text-sm">{t('bankDetails.sendAmount')}</p> */}
            </div>
          </div>

          {/* Invoice Content */}
          <div className="px-8 py-6 space-y-6">
            {/* Bank Details Section */}
            <div className="border-b-2 border-dashed border-gray-200 pb-6">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-[#00c48c]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
                {t('bankDetails.ourBankDetails')}
              </h3>
              <div className="bg-gradient-to-br from-[#190237] to-[#2a0f4f] rounded-xl p-5 text-white shadow-lg">
                <div className="space-y-4">
                  <div className="flex justify-between items-center pb-3 border-b border-white/10">
                    <span className="text-orange font-semibold text-sm">{t('bankDetails.bank')}</span>
                    <span className="font-bold text-lg">Fast Pay</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-orange font-semibold text-sm">{t('bankDetails.accountNumber')}</span>
                    <span className="font-bold text-lg tracking-wider">07702930873</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Order Details Section */}
            <div className="border-b-2 border-dashed border-gray-200 pb-6">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-[#00c48c]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                {t('bankDetails.orderDetails')}
              </h3>
              <div className="bg-gradient-to-br from-[#190237] to-[#00c48c70] rounded-xl p-5 ">
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <span className="text-orange font-semibold text-sm">{t('bankDetails.product')}</span>
                    <span className="text-white font-bold text-right max-w-[60%]">
                      {packDetails?.isDevice 
                        ? packDetails.deviceName || (packDetails.isDevice ? `${packDetails.quantity > 1 ? t('bankDetails.additionalDevices') : t('bankDetails.additionalDevice')} ${t('bankDetails.for')} ${packDetails.pack_name}` : packDetails.pack_name) 
                        : packDetails?.period === 'year' 
                          ? `${t('bankDetails.yearOf')} ${packDetails?.pack_name}`
                          : packDetails?.period === 'day'
                            ? `${t('bankDetails.dayOf')} ${packDetails?.pack_name}`
                            : `${t('bankDetails.monthOf')} ${packDetails?.pack_name}`}
                    </span>
                  </div>
                  {packDetails?.quantity > 1 && (
                    <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                      <span className="text-gray-600 font-semibold text-sm">{t('bankDetails.quantity')}</span>
                      <span className="text-gray-800 font-bold">{packDetails?.quantity}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Contact Section */}
            <div className="pt-4">
              <p className="text-gray-600 text-sm flex items-center justify-center gap-2">
                {t('bankDetails.contactUs')}{" "}
                <a 
                  href="https://wa.me/9647702930873" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-[#1f9c4d] font-bold hover:underline flex items-center gap-1"
                >
                  {t('bankDetails.whatsapp')}
                  <img
                    className="w-4 h-4"
                    src="/images/whatsapp.png"
                    alt="whatsapp"
                  />
                </a>
              </p>
            </div>
          </div>

          {/* Footer Decoration */}
          <div className="bg-gradient-to-r from-[#00c48c] to-[#4f008c] h-2"></div>
        </div>
      </Dialog.Panel>
    </Dialog>
  );
};

export default FastPayOrderDetailsInfoModalForPlans;
