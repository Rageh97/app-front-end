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
  { name: "العراق", code: "+964", flag: "🇮🇶", iso: "IQ", minLen: 10, maxLen: 10, example: "7700000000" },
  { name: "مصر", code: "+20", flag: "🇪🇬", iso: "EG", minLen: 10, maxLen: 11, example: "1012345678" },
  { name: "الأردن", code: "+962", flag: "🇯🇴", iso: "JO", minLen: 9, maxLen: 9, example: "791234567" },
  { name: "السعودية", code: "+966", flag: "🇸🇦", iso: "SA", minLen: 9, maxLen: 9, example: "512345678" },
  { name: "الإمارات", code: "+971", flag: "🇦🇪", iso: "AE", minLen: 9, maxLen: 9, example: "512345678" },
  { name: "ليبيا", code: "+218", flag: "🇱🇾", iso: "LY", minLen: 9, maxLen: 9, example: "912345678" },
  { name: "أخرى", code: "+", flag: "🌐", iso: "OTHER", minLen: 7, maxLen: 15, example: "+123456789" },
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
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [phoneTouched, setPhoneTouched] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [openErrorModal, setOpenErrorModal] = useState(false);

  // ── Validation logic ──────────────────────────────────────────
  const validatePhone = (number: string, country: typeof countries[0]): string | null => {
    if (!number) return "رقم الهاتف مطلوب.";

    if (country.iso === "OTHER") {
      const cleaned = number.replace(/\s/g, "");
      if (!/^\+?[0-9]{7,15}$/.test(cleaned))
        return "أدخل رقماً دولياً صحيحاً (مثال: +9647700000000)";
      return null;
    }

    const digits = number.replace(/\D/g, "");
    const normalized = digits.startsWith("0") ? digits.substring(1) : digits;

    if (normalized.length < country.minLen)
      return `الرقم أقصر من اللازم — يجب أن يكون ${country.minLen} رقماً (مثال: ${country.example})`;

    if (normalized.length > country.maxLen)
      return `الرقم أطول من اللازم — يجب أن يكون ${country.maxLen} رقماً`;

    return null;
  };

  const phoneValidationError = validatePhone(phoneNumber, selectedCountry);
  const isPhoneValid = phoneValidationError === null;

  // ── Handlers ─────────────────────────────────────────────────
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value;
    if (selectedCountry.iso !== "OTHER") {
      val = val.replace(/[^\d]/g, "");
    }
    setPhoneNumber(val);
    if (phoneTouched) {
      setPhoneError(validatePhone(val, selectedCountry));
    }
  };

  const handlePhoneBlur = () => {
    setPhoneTouched(true);
    setPhoneError(validatePhone(phoneNumber, selectedCountry));
  };

  const handleCountryChange = (c: typeof countries[0]) => {
    setSelectedCountry(c);
    setPhoneNumber(c.iso === "OTHER" ? "+" : "");
    setPhoneError(null);
    setPhoneTouched(false);
    setShowCountries(false);
  };

  const handlePay = async () => {
    setPhoneTouched(true);
    const err = validatePhone(phoneNumber, selectedCountry);
    if (err) {
      setPhoneError(err);
      return;
    }

    let digits = phoneNumber.replace(/\D/g, "");
    const fullPhone =
      selectedCountry.iso === "OTHER"
        ? phoneNumber.startsWith("+") ? phoneNumber : `+${phoneNumber}`
        : `${selectedCountry.code}${digits.startsWith("0") ? digits.substring(1) : digits}`;

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

  // ── Border colour based on validation state ───────────────────
  const inputBorder = !phoneTouched
    ? "border-white/5 focus:border-[#00c48c]"
    : isPhoneValid
    ? "border-[#00c48c]/70 focus:border-[#00c48c]"
    : "border-red-500/70 focus:border-red-500";

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
        <div className="flex flex-col gap-2">
          <label htmlFor="phone" className="text-white/60 text-xs font-bold text-right">
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
                  <div className="absolute top-full right-0 mt-2 w-52 bg-[#1a1129] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-20 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="max-h-60 overflow-y-auto scrollbar-hide">
                      {countries.map((c) => (
                        <button
                          key={c.iso}
                          type="button"
                          onClick={() => handleCountryChange(c)}
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
            <div className="relative flex-1">
              <input
                type="tel"
                id="phone"
                value={phoneNumber}
                onChange={handlePhoneChange}
                onBlur={handlePhoneBlur}
                maxLength={selectedCountry.iso === "OTHER" ? 16 : selectedCountry.maxLen + 1}
                placeholder={selectedCountry.example}
                className={`w-full bg-white/5 border-2 ${inputBorder} text-white rounded-lg py-4 pr-1 pl-10 text-left font-mono tracking-widest outline-none transition-all placeholder:text-white/20`}
              />
              {/* Valid checkmark */}
              {phoneTouched && isPhoneValid && (
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#00c48c] text-lg select-none">✓</span>
              )}
              {/* Invalid X */}
              {phoneTouched && !isPhoneValid && (
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-red-400 text-lg select-none">✕</span>
              )}
            </div>
          </div>

          {/* Inline error / hint */}
          <div className="min-h-[16px] text-right mr-1">
            {phoneTouched && phoneError ? (
              <p className="text-[10px] text-red-400 font-medium animate-in fade-in duration-200">
                ⚠ {phoneError}
              </p>
            ) : (
              <p className="text-[10px] text-white/30 italic">
                {selectedCountry.iso === "OTHER"
                  ? "* أدخل الرقم كاملاً مع كود الدولة"
                  : `* بدون كود الدولة — ${selectedCountry.minLen} أرقام (مثال: ${selectedCountry.example})`}
              </p>
            )}
          </div>
        </div>

        {/* Pay Button */}
        <button
          id="paytabs-pay-btn"
          onClick={handlePay}
          disabled={isPaying}
          className={`w-full group relative flex items-center justify-center gap-3 py-4.5 rounded-xl font-black text-white text-lg overflow-hidden transition-all duration-500 ${
            isPaying
              ? "bg-[#00c48c]/40 cursor-not-allowed"
              : "bg-[#00c48c]"
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
