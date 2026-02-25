"use client";

import { useState } from "react";
import { initiatePayTabsPayment } from "@/utils/paytabs/initiatePayTabsPayment";
import ProductDetail from "@/components/ProductDetail";
import ToolErrorModal from "@/components/Modals/ToolErrorModal";
import { ShieldCheck, CreditCard, Loader2 } from "lucide-react";

interface PayTabsPaymentProps {
  period: "day" | "month" | "year";
  productType: "tool" | "pack" | "credits";
  productData: any;
  productId: number;
}

const countries = [
  { name: "العراق", code: "+964", flag: "🇮🇶", iso: "IQ" },
  { name: "مصر", code: "+20", flag: "🇪🇬", iso: "EG" },
  { name: "الأردن", code: "+962", flag: "🇯🇴", iso: "JO" },
  { name: "السعودية", code: "+966", flag: "🇸🇦", iso: "SA" },
  { name: "الإمارات", code: "+971", flag: "🇦🇪", iso: "AE" },
  { name: "ليبيا", code: "+218", flag: "🇱🇾", iso: "LY" },
  { name: "أخرى", code: "+", flag: "🌐", iso: "OTHER" },
];

const PayTabsPayment: React.FC<PayTabsPaymentProps> = ({
  period,
  productType,
  productData,
  productId,
}) => {
  const [isPaying, setIsPaying] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [selectedCountry, setSelectedCountry] = useState(countries[0]);
  const [showCountries, setShowCountries] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [openErrorModal, setOpenErrorModal] = useState(false);

  const handlePay = async () => {
    if (!phoneNumber || phoneNumber.length < 8) {
      setErrorMessage("برجاء إدخال رقم هاتف صالح لإتمام عملية الدفع.");
      setOpenErrorModal(true);
      return;
    }

    const fullPhone = selectedCountry.code === "+" 
      ? phoneNumber.startsWith("+") ? phoneNumber : `+${phoneNumber}`
      : `${selectedCountry.code}${phoneNumber.startsWith("0") ? phoneNumber.substring(1) : phoneNumber}`;

    setIsPaying(true);
    try {
      const result = await initiatePayTabsPayment({
        period,
        productType,
        productId,
        customerPhone: fullPhone,
      });

      if (result.redirect_url) {
        window.location.href = result.redirect_url;
      } else {
        throw new Error("لم يتم استلام رابط الدفع من PayTabs.");
      }
    } catch (error: any) {
      const msg =
        error?.response?.data?.error ||
        error?.message ||
        "حدث خطأ أثناء تحضير الفاتورة. يرجى المحاولة مرة أخرى.";
      setErrorMessage(msg);
      setOpenErrorModal(true);
    } finally {
      setIsPaying(false);
    }
  };

  return (
    <>
      <div className="w-full flex flex-col gap-6">
        {/* Security Banner */}
        <div className="flex items-center gap-3 bg-white/10 border border-white/20 rounded-lg px-4 py-3 shadow-inner">
          <div className="bg-[#00c48c]/20 p-1.5 rounded-lg">
            <ShieldCheck size={20} className="text-[#00c48c]" />
          </div>
          <p className="text-white text-xs font-medium text-right leading-relaxed">
            بوابة دفع مشفرة بالكامل ومعتمدة عالمياً لتأمين بياناتك المالية.
          </p>
        </div>

        {/* Product Summary */}
        <div className="bg-black/20 rounded-xl p-4 border border-white/10">
          <ProductDetail
            productType={productType}
            productData={productData}
            period={period}
            currency="IQD"
          />
        </div>

        {/* Phone Input Section */}
        <div className="flex flex-col gap-3">
          <label htmlFor="phone" className="text-white/60 text-xs font-bold mr-1 text-right">
           أدخل رقم الهاتف 
          </label>
          <div className="relative flex gap-2">
            {/* Country Selector */}
            <div className="relative shrink-0">
              <button
                type="button"
                onClick={() => setShowCountries(!showCountries)}
                className="h-full flex items-center gap-2 bg-white/10 border-2 border-white/5 hover:border-white/20 px-4 rounded-lg text-white transition-all outline-none"
              >
                <span className="text-xl">{selectedCountry.flag}</span>
                <span className="text-sm font-bold font-mono">{selectedCountry.code}</span>
              </button>

              {showCountries && (
                <>
                  <div 
                    className="fixed inset-0 z-10" 
                    onClick={() => setShowCountries(false)}
                  />
                  <div className="absolute top-full right-0 mt-2 w-48 bg-[#1a1129] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-20 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="max-h-60 overflow-y-auto scrollbar-hide">
                      {countries.map((c) => (
                        <button
                          key={c.iso}
                          type="button"
                          onClick={() => {
                            setSelectedCountry(c);
                            setShowCountries(false);
                            if (c.iso === 'OTHER') setPhoneNumber('+');
                          }}
                          className={`w-full flex items-center gap-3 px-4 py-3 text-right hover:bg-white/5 transition-colors ${
                            selectedCountry.iso === c.iso ? 'bg-[#00c48c]/20 text-[#00c48c]' : 'text-white/80'
                          }`}
                        >
                          <span className="text-lg">{c.flag}</span>
                          <span className="flex-1 text-sm font-bold">{c.name}</span>
                          <span className="text-[10px] font-mono opacity-50">{c.code}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Input Field */}
            <div className="relative flex-1 group">
              <input
                type="tel"
                id="phone"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder={
                  selectedCountry.iso === 'IQ' ? "7700000000" : 
                  selectedCountry.iso === 'OTHER' ? "+123456789" : "رقم الهاتف"
                }
                className="w-full bg-white/5 border-2 border-white/5 focus:border-[#00c48c] text-white rounded-lg py-4 pr-1 pl-4 text-left font-mono tracking-widest outline-none transition-all placeholder:text-white/20"
              />
            </div>
          </div>
          <p className="text-[10px] text-white/30 text-right mr-1 italic">
            {selectedCountry.iso === 'OTHER' 
              ? "* أدخل الرقم كاملاً مع كود الدولة الخاص بك (مثال: +123456789)"
              : "* تأكد من اختيار الدولة الصحيحة وإدخال الرقم بدون كود الدولة"
            }
          </p>
        </div>

        {/* Pay Button */}
        <button
          id="paytabs-pay-btn"
          onClick={handlePay}
          disabled={isPaying}
          className={`w-full group relative flex items-center justify-center gap-3 py-4.5 rounded-xl font-black text-white text-lg overflow-hidden transition-all duration-500 ${
            isPaying
              ? "bg-[#00c48c]/40 cursor-not-allowed"
              : "bg-[#00c48c] "
          }`}
        >
          {/* Animated background on hover */}
          <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:animate-shimmer" />
          
          {isPaying ? (
            <>
              <Loader2 size={10} className="animate-spin" />
              <span className="animate-pulse">جاري التحويل...</span>
            </>
          ) : (
            <>
              <CreditCard size={22} className="group-hover:rotate-12 transition-transform" />
              تأكيد الدفع والاشتراك
            </>
          )}
        </button>

        {/* Accepted logos */}
        <div className="flex flex-col items-center gap-4">
          <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest px-2 py-1 bg-white/5 rounded-md border border-white/5">مدفوعات آمنة بواسطة</p>
          <div className="flex items-center justify-center transition-all duration-300">
            <img
              src="/images/visa-master.png"
              alt="Visa and Mastercard"
              className="h-10 object-contain drop-shadow-[0_5px_15px_rgba(0,0,0,0.2)]"
            />
          </div>
        </div>
      </div>

      <ToolErrorModal
        title="فشل الدفع"
        message={errorMessage}
        modalOpen={openErrorModal}
        setModalOpen={setOpenErrorModal}
      />
    </>
  );
};

export default PayTabsPayment;
