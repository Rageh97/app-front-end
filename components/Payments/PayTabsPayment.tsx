"use client";

import { useState } from "react";
import { initiatePayTabsPayment } from "@/utils/paytabs/initiatePayTabsPayment";
import ProductDetail from "@/components/ProductDetail";
import ToolErrorModal from "@/components/Modals/ToolErrorModal";
import { ShieldCheck, CreditCard, Loader2, Tag, CheckCircle2, X } from "lucide-react";
import toast from "react-hot-toast";
import axios from "@/utils/api";

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

  // ── Coupon state ─────────────────────────────────────────────
  const [couponCode, setCouponCode] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<{
    coupon_id: number;
    coupon_code: string;
    coupon_type: string;
    discount_percentage: number | null;
    extra_days: number | null;
  } | null>(null);
  const [couponPricing, setCouponPricing] = useState<{
    originalPrice: number;
    finalPrice: number;
    extraDays: number;
    freeDays: number;
    savedAmount: number;
  } | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);

  const validatePhone = (number: string, country: typeof countries[0]): string | null => {
    if (!number) return "رقم الهاتف مطلوب.";
    if (country.iso === "OTHER") {
      const cleaned = number.replace(/\s/g, "");
      if (!/^\+?[0-9]{7,15}$/.test(cleaned)) return "أدخل رقماً دولياً صحيحاً (مثال: +9647700000000)";
      return null;
    }
    const digits = number.replace(/\D/g, "");
    const normalized = digits.startsWith("0") ? digits.substring(1) : digits;
    if (normalized.length < country.minLen) return `الرقم أقصر من اللازم (مثال: ${country.example})`;
    if (normalized.length > country.maxLen) return `الرقم أطول من اللازم`;
    return null;
  };

  const isPhoneValid = validatePhone(phoneNumber, selectedCountry) === null;

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value;
    if (selectedCountry.iso !== "OTHER") val = val.replace(/[^\d]/g, "");
    setPhoneNumber(val);
    if (phoneTouched) setPhoneError(validatePhone(val, selectedCountry));
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
    // Explicit safety for finalPrice to avoid null reading errors
    const currentPricing = couponPricing;
    const isFree = !!currentPricing && typeof currentPricing === 'object' && currentPricing.finalPrice === 0;
    let fullPhone = "FREE_ACCOUNT";
    
    if (!isFree) {
      setPhoneTouched(true);
      const err = validatePhone(phoneNumber, selectedCountry);
      if (err) {
        setPhoneError(err);
        return;
      }
      let digits = phoneNumber.replace(/\D/g, "");
      fullPhone = selectedCountry.iso === "OTHER" ? (phoneNumber.startsWith("+") ? phoneNumber : `+${phoneNumber}`) : `${selectedCountry.code}${digits.startsWith("0") ? digits.substring(1) : digits}`;
    }

    setIsPaying(true);
    try {
      if (isFree) {
        // IMPORTANT: Must use FormData because the offline-payment endpoint uses multer middleware
        // which only parses multipart/form-data requests, not plain JSON.
        // NOTE: axios instance from @/utils/api already has baseURL set, so use relative path only.
        const formData = new FormData();
        formData.append("userFullName", "Free Activation");
        formData.append("period", period);
        formData.append("productType", productType);
        formData.append("productId", String(productId));
        formData.append("paymentMethod", "Zain");
        if (appliedCoupon?.coupon_code) {
          formData.append("couponCode", appliedCoupon.coupon_code);
        }

        // axios interceptor from @/utils/api automatically adds Authorization & User-Client headers
        const response = await axios.post("/api/payment/offline-payment", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });

        // Check the response — backend sends "Subscription activated successfully."
        if (response.status === 200) {
          toast.success("تم تفعيل الاشتراك بنجاح! 🎉");
          setTimeout(() => window.location.reload(), 1500);
        } else {
          throw new Error("لم يتم تفعيل الاشتراك، حاول مرة أخرى.");
        }
      } else {
        const result = await initiatePayTabsPayment({ period, productType, productId, customerPhone: fullPhone, couponCode: appliedCoupon ? appliedCoupon.coupon_code : undefined });
        if (result.redirect_url) window.location.href = result.redirect_url;
        else throw new Error("لم يتم استلام رابط الدفع.");
      }
    } catch (error: any) {
      setErrorMessage(error?.response?.data?.error || error?.message || "حدث خطأ أثناء تحضير الفاتورة.");
      setOpenErrorModal(true);
    } finally {
      setIsPaying(false);
    }
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    setCouponError(null);
    try {
      const token = localStorage.getItem("a") || "";
      const clientId = (global as any).clientId1328 || "";
      const res = await axios.post("api/coupons/validate", { couponCode: couponCode.trim(), productType, productId, period }, { headers: { Authorization: token, "User-Client": clientId } });
      if (res.data.success) {
        setAppliedCoupon(res.data.coupon);
        setCouponPricing(res.data.pricing);
        toast.success("تم تطبيق الكوبون بنجاح! 🎫");
      }
    } catch (err: any) {
      setCouponError(err?.response?.data?.message || "الكوبون غير صالح.");
      setAppliedCoupon(null);
      setCouponPricing(null);
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponPricing(null);
    setCouponCode("");
    setCouponError(null);
  };

  const inputBorder = !phoneTouched ? "border-white/5 focus:border-[#00c48c]" : isPhoneValid ? "border-[#00c48c]/70 focus:border-[#00c48c]" : "border-red-500/70 focus:border-red-500";

  return (
    <>
      <div className="w-full flex flex-col gap-3 px-1">
        {/* Security Banner - Hide if free */}
        {(couponPricing?.finalPrice ?? -1) !== 0 && (
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-3 py-2 animate-in fade-in duration-300">
            <ShieldCheck size={16} className="text-[#00c48c] shrink-0" />
            <p className="text-white/60 text-[10px] font-medium leading-tight">
              بوابة دفع مشفرة بالكامل ومعتمدة عالمياً لتأمين بياناتك المالية.
            </p>
          </div>
        )}

        {/* Success Message for Free Coupon */}
        {couponPricing?.finalPrice === 0 && (
          <div className="bg-[#00c48c]/10 border border-[#00c48c]/20 p-3 rounded-lg flex items-center gap-3 animate-in slide-in-from-top-2 duration-500">
            <div className="p-1.5 rounded-full bg-[#00c48c]/20">
              <CheckCircle2 size={20} className="text-[#00c48c]" />
            </div>
            <div>
              <p className="text-white font-bold text-[11px]">كوبون أيام مجانية!</p>
              <p className="text-[#00c48c] text-[9px]">تم تصفير المبلغ. يمكنك التفعيل الآن مجاناً.</p>
            </div>
          </div>
        )}

        {/* Product Summary */}
        {(() => {
          const hasPricing = couponPricing && typeof couponPricing === 'object' && couponPricing.finalPrice !== undefined;
          return (
            <ProductDetail
              productType={productType}
              productData={hasPricing ? { 
                ...productData, 
                monthly_price: period === "month" ? couponPricing.finalPrice : productData?.monthly_price, 
                yearly_price: period === "year" ? couponPricing.finalPrice : productData?.yearly_price, 
                tool_month_price: period === "month" ? couponPricing.finalPrice : productData?.tool_month_price, 
                tool_year_price: period === "year" ? couponPricing.finalPrice : productData?.tool_year_price, 
                tool_day_price: period === "day" ? couponPricing.finalPrice : productData?.tool_day_price 
              } : productData}
              period={period}
              currency="IQD"
              originalPrice={couponPricing?.originalPrice}
            />
          );
        })()}

        {/* Coupon Code Input - Hide if it's an individual tool */}
        {productType !== 'tool' && (
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between gap-2">
              <label className="text-white/40 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                <Tag size={10} className="text-[#00c48c]" />
                كوبون الخصم
              </label>
              {appliedCoupon && (
                <button onClick={handleRemoveCoupon} className="text-red-400 text-[9px] font-bold hover:underline">إزالة</button>
              )}
            </div>
            {!appliedCoupon ? (
              <div className="flex gap-2">
                <input type="text" value={couponCode} onChange={(e) => { setCouponCode(e.target.value.toUpperCase()); setCouponError(null); }} onKeyDown={(e) => e.key === "Enter" && handleApplyCoupon()} placeholder="أدخل كود الخصم..." className="flex-1 bg-white/5 border border-white/10 rounded-lg py-2 px-3 text-xs font-mono tracking-widest outline-none focus:border-[#00c48c]/50 placeholder:text-white/10" />
                <button type="button" onClick={handleApplyCoupon} disabled={couponLoading || !couponCode.trim()} className="px-4 py-2 rounded-lg bg-[#00c48c] hover:bg-[#00c48c]/90 text-white font-bold text-[11px] disabled:opacity-40">
                  {couponLoading ? <Loader2 size={12} className="animate-spin" /> : "تطبيق"}
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-[#00c48c]/10 border border-[#00c48c]/30">
                <div className="flex items-center gap-2">
                  <span className="text-[#00c48c] font-mono font-bold text-xs tracking-widest">{appliedCoupon.coupon_code}</span>
                  <CheckCircle2 size={12} className="text-[#00c48c]" />
                </div>
                <div className="flex gap-2">
                  {(couponPricing?.savedAmount ?? 0) > 0 && <span className="bg-[#00c48c]/20 text-[#00c48c] text-[9px] px-1.5 py-0.5 rounded font-bold">وفّر {couponPricing?.savedAmount?.toLocaleString()} IQD</span>}
                  {(couponPricing?.extraDays ?? 0) > 0 && <span className="bg-blue-500/20 text-blue-400 text-[9px] px-1.5 py-0.5 rounded font-bold">{couponPricing?.extraDays} أيام إضافية</span>}
                </div>
              </div>
            )}
            {couponError && <p className="text-[9px] text-red-400 font-bold bg-red-500/10 p-1 px-2 rounded border border-red-500/20">{couponError}</p>}
          </div>
        )}

        {/* Phone Input Section - Hide if free */}
        {(couponPricing?.finalPrice ?? -1) !== 0 && (
          <div className="flex flex-col gap-1.5 animate-in fade-in duration-300">
            <label htmlFor="phone" className="text-white/40 text-[10px] font-bold uppercase tracking-wider">أدخل رقم الهاتف</label>
            <div className="flex gap-2">
              <div className="relative shrink-0">
                <button type="button" onClick={() => setShowCountries(!showCountries)} className="h-full flex items-center gap-2 bg-white/10 border border-white/20 px-3 rounded-lg text-white transition-all outline-none">
                  <span className="text-sm">{selectedCountry.flag}</span>
                  <span className="text-xs font-bold font-mono">{selectedCountry.code}</span>
                </button>
                {showCountries && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowCountries(false)} />
                    <div className="absolute top-full right-0 mt-1 w-44 bg-[#1a1129] border border-white/10 rounded-lg shadow-xl overflow-hidden z-20">
                      <div className="max-h-48 overflow-y-auto">
                        {countries.map((c) => (
                          <button key={c.iso} type="button" onClick={() => handleCountryChange(c)} className={`w-full flex items-center gap-2 px-3 py-2 hover:bg-white/5 ${selectedCountry.iso === c.iso ? 'bg-[#00c48c]/20 text-[#00c48c]' : 'text-white/80'}`}>
                            <span className="text-sm">{c.flag}</span>
                            <span className="text-[10px] font-bold">{c.name}</span>
                            <span className="text-[9px] font-mono opacity-50 ml-auto">{c.code}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
              <div className="relative flex-1">
                <input type="tel" id="phone" value={phoneNumber} onChange={handlePhoneChange} onBlur={handlePhoneBlur} maxLength={selectedCountry.maxLen + 1} placeholder={selectedCountry.example} className={`w-full bg-white/5 border ${inputBorder} text-white rounded-lg py-2.5 px-3 text-sm font-mono tracking-widest outline-none transition-all placeholder:text-white/10`} />
                {phoneTouched && (isPhoneValid ? <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#00c48c] text-xs">✓</span> : <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-red-400 text-xs text-right">✕</span>)}
              </div>
            </div>
            <p className="text-[9px] text-white/30 italic">
              {selectedCountry.iso === "OTHER" ? "* أدخل الرقم كاملاً مع كود الدولة" : `* بدون كود الدولة (مثال: ${selectedCountry.example})`}
            </p>
            {phoneTouched && phoneError && <p className="text-[9px] text-red-400 font-bold bg-red-500/10 p-1 px-2 rounded border border-red-500/20">{phoneError}</p>}
          </div>
        )}

        {/* Pay Button */}
        <button id="paytabs-pay-btn" onClick={handlePay} disabled={isPaying || (couponPricing && typeof couponPricing === 'object' ? couponPricing.finalPrice !== 0 && !isPhoneValid : !isPhoneValid)} className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-black text-white text-sm transition-all shadow-lg ${isPaying ? "bg-[#00c48c]/40 cursor-not-allowed" : "bg-gradient-to-r from-[#00c48c] to-[#00a87a] hover:brightness-110 shadow-[#00c48c]/20"}`}>
          {isPaying ? (
            <>
              <Loader2 size={14} className="animate-spin" />
              <span className="animate-pulse">جاري التفعيل...</span>
            </>
          ) : (
            <>
              {(couponPricing?.finalPrice ?? -1) === 0 ? <CheckCircle2 size={18} /> : <CreditCard size={18} />}
              {(couponPricing?.finalPrice ?? -1) === 0 ? "تفعيل الاشتراك مجاناً" : "تأكيد الدفع والاشتراك"}
            </>
          )}
        </button>

        {/* Security Logos - Hide if free */}
        {(couponPricing?.finalPrice ?? -1) !== 0 && (
          <div className="flex items-center justify-center gap-4 py-2 border-t border-white/5 mt-1 animate-in fade-in duration-300">
             <img src="/images/visa-master.png" alt="Visa Mastercard" className="h-6  transition-all" />
             <p className="text-[8px] text-white/30 font-bold uppercase tracking-widest">SECURE PAYMENT</p>
          </div>
        )}
      </div>

      <ToolErrorModal title="فشل الدفع" message={errorMessage} modalOpen={openErrorModal} setModalOpen={setOpenErrorModal} />
    </>
  );
};

export default PayTabsPayment;
