import { FunctionComponent, useState, ChangeEvent, useEffect, useRef } from "react";
import LoadingButton from "../LoadingButton";
import { useFormik } from "formik";
import * as Yup from "yup";
import ToolErrorModal from "../Modals/ToolErrorModal";
import { NewOfflinePayment } from "@/types/offline-payment/new-offline-payment-dto";
import { useOfflinePayment } from "@/utils/offline-payment/createOfflinePayment";
import ProductDetail from "../ProductDetail";
import CihBankOrderDetailsInfoModalForPlans from "../Modals/CihBankOrderDetailsInfoModalForPlans";
import TijariOrderDetailsInfoModalForPlans from "../Modals/TijariBankOrderDetailsInfoModalForPlans";
import { useTranslation } from 'react-i18next';
import IraqBankOrderDetailsInfoModalForPlans from "../Modals/IraqBankOrderDetailsInfoModalForPlans";
import AsiaPayOrderDetailsInfoModalForPlans from "../Modals/AsiaPayOrderDetailsInfoModalForPlans";
import FastPayOrderDetailsInfoModalForPlans from "../Modals/FastPayOrderDetailsInfoModalForPlans";
import AsiaSelOrderDetailsInfoModalForPlans from "../Modals/AsiaSelOrderDetailsInfoModalForPlans";
import { Tag, CheckCircle2, X, AlertCircle, Loader2 } from "lucide-react";
import axios from "@/utils/api";
import toast from "react-hot-toast";

const OfflinePayment: FunctionComponent<NewOfflinePayment> = ({
  period,
  productId,
  paymentMethod,
  productType,
  productData,
  setDetailsModalOpen,
}) => {
  const { t } = useTranslation();
  
  // Calculate discounted prices
  const getDiscountedPrice = (price: number) => {
    const discountPercentage = productData?.discount_percentage || 0;
    if (discountPercentage > 0) {
      return Math.round(price * (1 - discountPercentage / 100) * 100) / 100;
    }
    return price;
  };
  
  const discountedMonthlyPrice = getDiscountedPrice(productData?.monthly_price || 0);
  const discountedYearlyPrice = getDiscountedPrice(productData?.yearly_price || 0);
  
  const [openErrorModal, setIsOpenErrorModal] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>(null);
  const [showCihModal, setShowCihModal] = useState<boolean>(false);
  const [showTijariModal, setShowTijariModal] = useState<boolean>(false);
  const [showIraqModal, setShowIraqModal] = useState<boolean>(false);
  const [showAsiaPayModal, setShowAsiaPayModal] = useState<boolean>(false);
  const [showAsiaSelModal, setShowAsiaSelModal] = useState<boolean>(false);
  const [showFastPayModal, setShowFastPayModal] = useState<boolean>(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<{success: boolean; message: string} | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [transactionNumber, setTransactionNumber] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const {
    mutate: OfflinePayment,
    isLoading: isPaying,
    isSuccess,
    isError,
    error,
  } = useOfflinePayment();

  const requiredMessage = "This field is required.";

  // Generate random transaction number
  const generateTransactionNumber = (): string => {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `${timestamp}${random}`;
  };

  useEffect(() => {
    if (isError) {
      setErrorMessage(t('offlinePayment.orderExists'));
      setIsOpenErrorModal(true);
    }
  }, [isError, t]);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      const validation = validateFile(file);
      if (validation.isValid) {
        setSelectedFile(file);
        setUploadStatus(null);
      } else {
        setErrorMessage(validation.message);
        setIsOpenErrorModal(true);
      }
    }
  };

  const handleFileSelect = (file: File) => {
    const validation = validateFile(file);
    if (validation.isValid) {
      setSelectedFile(file);
      setUploadStatus(null);
    } else {
      setErrorMessage(validation.message);
      setIsOpenErrorModal(true);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleBoxClick = () => {
    fileInputRef.current?.click();
  };

  const validateFile = (file: File): { isValid: boolean; message: string } => {
    // Check file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      return { isValid: false, message: 'File size must be less than 5MB' };
    }

    // Check file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      return { isValid: false, message: 'Only JPG, PNG, and PDF files are allowed' };
    }

    return { isValid: true, message: '' };
  };

  // ── Coupon handlers ──────────────────────────────────────────
  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    setCouponError(null);
    try {
      const token = localStorage.getItem("a") || "";
      const clientId = (global as any).clientId1328 || "";
      const res = await axios.post(
        "api/coupons/validate",
        { couponCode: couponCode.trim(), productType, productId, period },
        { headers: { Authorization: token, "User-Client": clientId } }
      );
      if (res.data.success) {
        setAppliedCoupon(res.data.coupon);
        setCouponPricing(res.data.pricing);
        toast.success("تم تطبيق الكوبون بنجاح! 🎫");
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || "الكوبون غير صالح.";
      setCouponError(msg);
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

  const formik = useFormik({
    initialValues: {
      userFullName: generateTransactionNumber(),
    },
    validationSchema: Yup.object({
      userFullName: Yup.string().required(requiredMessage),
    }),
    onSubmit: (values: NewOfflinePayment) => {
      // Robust safety for couponPricing access
      const currentPricing = couponPricing;
      const isFree = !!currentPricing && typeof currentPricing === 'object' && currentPricing.finalPrice === 0;

      // Check if payment proof is selected (only if not free)
      if (!isFree && !selectedFile) {
        setErrorMessage('Please select a payment proof file before placing the order.');
        setIsOpenErrorModal(true);
        return;
      }

      // Validate the file (only if not free)
      if (!isFree && selectedFile) {
        const fileValidation = validateFile(selectedFile);
        if (!fileValidation.isValid) {
          setErrorMessage(fileValidation.message);
          setIsOpenErrorModal(true);
          return;
        }
      }

      // Prepare the order data
      const orderData: NewOfflinePayment = {
        userFullName: values.userFullName,
        period: period,
        paymentMethod: paymentMethod,
        productType: productType,
        productId: productId,
        couponCode: appliedCoupon?.coupon_code || undefined,
      };
      
      // If this is a device order, add device-specific data
      if (productType === 'device' && productData) {
        orderData.deviceName = productData.deviceName || 'Additional Device';
        orderData.quantity = productData.quantity || 1;
        orderData.isToolDevice = productData.isToolDevice || false;
      }
      
      // Call the mutation with both data and file
      OfflinePayment({ data: orderData, file: selectedFile || undefined });
    },
  });

  // Update transaction number state when formik initializes
  useEffect(() => {
    if (formik.values.userFullName) {
      setTransactionNumber(formik.values.userFullName);
    }
  }, [formik.values.userFullName]);

  useEffect(() => {
    if (isSuccess) {
      const isFree = (couponPricing?.finalPrice ?? -1) === 0;
      
      // Only show bank details modal if this wasn't a free activation
      if (!isFree) {
        if (paymentMethod === "Zain") {
          setShowCihModal(true);
        } else if (paymentMethod === "Alrafedeen") {
          setShowTijariModal(true);
        } else if (paymentMethod === "IraqBank") {
          setShowIraqModal(true);
        } else if (paymentMethod === "AsiaPay") {
          setShowAsiaPayModal(true);
        } else if (paymentMethod === "AsiaSel") {
          setShowAsiaSelModal(true);
        } else if (paymentMethod === "FastPay") {
          setShowFastPayModal(true);
        }
      } else {
        // For free subscriptions, just refresh or show a success toast was already done by caller?
        // Actually the backend might return success and we just want to stay on page or reload
        toast.success("تم تفعيل الاشتراك مجاناً! 🎉");
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      }
    }
  }, [isSuccess, paymentMethod, couponPricing]);

  return (
    <>
      <div className="w-full flex flex-col gap-3 px-1">
        {/* Transaction Number Section - Hide if free */}
        {(couponPricing?.finalPrice ?? -1) !== 0 && (
          <div className="w-full flex flex-col items-center gap-2 animate-in fade-in duration-300">
            <div className="w-full">
              <label className="block text-[10px] font-bold text-white/60 mb-1 uppercase tracking-wider">
                رقم العملية
              </label>
              <input
                type="text"
                name="userFullName"
                id="userFullName"
                value={transactionNumber}
                readOnly
                className="bg-white/5 border border-white/10 text-white text-xs rounded-lg block text-center w-full p-2 cursor-default font-mono tracking-widest shadow-inner overflow-hidden truncate"
              />
            </div>

            <div className="bg-white/5 border border-white/10 p-2 rounded-lg w-full text-center">
              <p className="text-white/90 text-[10px] font-bold leading-tight">
                {t('offlinePayment.makePayment')}
              </p>
              <p className="text-white/40 text-[9px] mt-0.5">
                {t('offlinePayment.seeAccountNumber')}
              </p>
            </div>
          </div>
        )}

        {/* Logo and File Upload Section - Hide if free */}
        {(couponPricing?.finalPrice ?? -1) !== 0 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-center animate-in fade-in zoom-in-95 duration-300">
            <div className="md:col-span-1 flex items-center justify-center p-2 bg-white/5 rounded-xl border border-white/10">
              <img 
                className="w-full max-w-[80px] rounded-lg" 
                src={paymentMethod === "Zain" ? "https://stock-pik.com/tools/Zain%20Cash.webp" : paymentMethod === "Alrafedeen" ? "https://stock-pik.com/tools/Al%20Rafidain%20Bank.webp" : paymentMethod === "AsiaPay" ? "https://www2.0zz0.com/2025/07/02/22/577308638.png" : paymentMethod === "IraqBank" ? "https://www2.0zz0.com/2025/07/02/22/854022167.png" : paymentMethod === "FastPay" ? "https://stock-pik.com/tools/Al%20Rafidain%20Bank.webp" : "https://www2.0zz0.com/2025/07/02/22/854022167.png"} 
                alt={paymentMethod} 
              />
            </div>

            <div className="md:col-span-3">
              <div 
                className={`w-full flex justify-center border border-dashed rounded-xl transition-all duration-300 cursor-pointer ${
                  isDragging ? 'border-[#00c48c] bg-[#00c48c]/10 scale-[1.01]' : 'border-white/10 bg-white/[0.02]'
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={handleBoxClick}
              >
                <div className="text-center w-full p-4 min-h-[120px] flex flex-col items-center justify-center gap-2">
                  <input ref={fileInputRef} id="file-upload" type="file" className="hidden" accept="image/*,.pdf" onChange={handleFileChange} />
                  {!selectedFile ? (
                    <div className="flex flex-col items-center gap-1">
                      <div className="p-2 rounded-full bg-white/5">
                        <svg className="w-5 h-5 text-white/30" stroke="currentColor" fill="none" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                        </svg>
                      </div>
                      <p className="text-[10px] font-bold text-white/70">{t('offlinePayment.chooseImage')}</p>
                      <p className="text-[9px] text-white/30">PNG, JPG, PDF (Max 5MB)</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2 w-full">
                      <div className="flex items-center gap-2 bg-white/5 p-2 rounded-lg border border-white/10 w-full">
                        <CheckCircle2 size={14} className="text-[#00c48c] shrink-0" />
                        <p className="text-[10px] font-bold text-white truncate flex-1">{selectedFile.name}</p>
                        <button type="button" onClick={(e) => { e.stopPropagation(); setSelectedFile(null); }} className="p-1 hover:bg-red-500/10 text-white/30 hover:text-red-400 rounded">
                          <X size={12} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Success Message for Free Coupon */}
        {(couponPricing?.finalPrice ?? -1) === 0 && (
          <div className="bg-[#00c48c]/10 border border-[#00c48c]/20 p-4 rounded-xl flex items-center gap-3 animate-in slide-in-from-bottom-2 duration-500">
            <div className="p-2 rounded-full bg-[#00c48c]/20">
              <CheckCircle2 size={24} className="text-[#00c48c]" />
            </div>
            <div>
              <p className="text-white font-bold text-xs">كوبون أيام مجانية!</p>
              <p className="text-[#00c48c] text-[10px]">اضغط على الزر أدناه لتفعيل اشتراكك فوراً وبدون أي تكلفة.</p>
            </div>
          </div>
        )}

        {/* Coupon and Submit Section */}
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5 px-1">
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

          {(() => {
            const hasPricing = couponPricing && typeof couponPricing === 'object' && couponPricing.finalPrice !== undefined;
            return (
              <ProductDetail 
                productType={productType} 
                productData={hasPricing ? { 
                  ...productData, 
                  pack_price: couponPricing.finalPrice, 
                  total_price: couponPricing.finalPrice, 
                  monthly_price: period === "month" ? couponPricing.finalPrice : productData?.monthly_price, 
                  yearly_price: period === "year" ? couponPricing.finalPrice : productData?.yearly_price 
                } : { 
                  ...productData, 
                  total_price: productType === 'device' ? (productData?.pack_price * (productData?.quantity || 1)) : productData?.total_price 
                }} 
                period={period} 
                currency="IQD" 
                originalPrice={couponPricing?.originalPrice}
              />
            );
          })()}

          <form noValidate onSubmit={formik.handleSubmit} className="w-full">
            <LoadingButton 
              isDisabled={isPaying || (couponPricing && typeof couponPricing === 'object' ? couponPricing.finalPrice !== 0 && !selectedFile : !selectedFile)} 
              isLoading={isPaying} 
              className={`w-full py-3 rounded-xl font-black text-white text-xs transition-all shadow-lg ${isPaying ? 'opacity-50' : (couponPricing && typeof couponPricing === 'object' ? couponPricing.finalPrice !== 0 && !selectedFile : !selectedFile) ? 'bg-white/10 text-white/20' : 'bg-gradient-to-r from-[#00c48c] to-[#00a87a] shadow-[#00c48c]/20'}`} 
              onClick={() => { }}
            >
              {(couponPricing?.finalPrice ?? -1) === 0 ? "تفعيل الاشتراك مجاناً" : t('offlinePayment.placeOrder')}
            </LoadingButton>
          </form>
        </div>
      </div>

      <ToolErrorModal title={t('offlinePayment.failedToOrder')} message={errorMessage} modalOpen={openErrorModal} setModalOpen={setIsOpenErrorModal} />
      
      {/* Detail Modals */}
      <CihBankOrderDetailsInfoModalForPlans modalOpen={showCihModal} setModalOpen={setShowCihModal} packDetails={{ isDevice: productType === 'device', pack_name: productType === 'device' ? productData?.deviceName || 'Additional Device' : productData?.pack_name || productData?.tool_name, pack_price: productType === 'device' ? productData?.pack_price / (productData?.quantity || 1) : productData?.pack_price, monthly_price: productType === 'device' ? productData?.pack_price : discountedMonthlyPrice, yearly_price: productType === 'device' ? productData?.pack_price * 12 : discountedYearlyPrice, period: period || 'month', quantity: productType === 'device' ? productData?.quantity || 1 : 1 }} />
      <TijariOrderDetailsInfoModalForPlans modalOpen={showTijariModal} setModalOpen={setShowTijariModal} packDetails={{ isDevice: productType === 'device', pack_name: productType === 'device' ? productData?.deviceName || 'Additional Device' : productData?.pack_name || productData?.tool_name, pack_price: productType === 'device' ? productData?.pack_price / (productData?.quantity || 1) : productData?.pack_price, monthly_price: discountedMonthlyPrice, yearly_price: discountedYearlyPrice, period: period || 'month', quantity: productType === 'device' ? productData?.quantity || 1 : 1 }} />
      <IraqBankOrderDetailsInfoModalForPlans modalOpen={showIraqModal} setModalOpen={setShowIraqModal} packDetails={{ isDevice: productType === 'device', pack_name: productType === 'device' ? productData?.deviceName || 'Additional Device' : productData?.pack_name || productData?.tool_name, pack_price: productType === 'device' ? productData?.pack_price / (productData?.quantity || 1) : productData?.pack_price, monthly_price: discountedMonthlyPrice, yearly_price: discountedYearlyPrice, period: period || 'month', quantity: productType === 'device' ? productData?.quantity || 1 : 1 }} />
      <AsiaPayOrderDetailsInfoModalForPlans modalOpen={showAsiaPayModal} setModalOpen={setShowAsiaPayModal} packDetails={{ isDevice: productType === 'device', pack_name: productType === 'device' ? productData?.deviceName || 'Additional Device' : productData?.pack_name || productData?.tool_name, pack_price: productType === 'device' ? productData?.pack_price / (productData?.quantity || 1) : productData?.pack_price, monthly_price: discountedMonthlyPrice, yearly_price: discountedYearlyPrice, period: period || 'month', quantity: productType === 'device' ? productData?.quantity || 1 : 1 }} />
      <FastPayOrderDetailsInfoModalForPlans modalOpen={showFastPayModal} setModalOpen={setShowFastPayModal} packDetails={{ isDevice: productType === 'device', pack_name: productType === 'device' ? productData?.deviceName || 'Additional Device' : productData?.pack_name || productData?.tool_name, pack_price: productType === 'device' ? productData?.pack_price / (productData?.quantity || 1) : productData?.pack_price, monthly_price: discountedMonthlyPrice, yearly_price: discountedYearlyPrice, period: period || 'month', quantity: productType === 'device' ? productData?.quantity || 1 : 1 }} />
      <AsiaSelOrderDetailsInfoModalForPlans modalOpen={showAsiaSelModal} setModalOpen={setShowAsiaSelModal} packDetails={{ isDevice: productType === 'device', pack_name: productType === 'device' ? productData?.deviceName || 'Additional Device' : productData?.pack_name || productData?.tool_name, pack_price: productType === 'device' ? productData?.pack_price / (productData?.quantity || 1) : productData?.pack_price, monthly_price: discountedMonthlyPrice, yearly_price: discountedYearlyPrice, period: period || 'month', quantity: productType === 'device' ? productData?.quantity || 1 : 1 }} />
    </>
  );
};

export default OfflinePayment;