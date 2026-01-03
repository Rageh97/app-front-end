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

  const formik = useFormik({
    initialValues: {
      userFullName: generateTransactionNumber(),
    },
    validationSchema: Yup.object({
      userFullName: Yup.string().required(requiredMessage),
    }),
    onSubmit: (values: NewOfflinePayment) => {
      // Check if payment proof is selected
      if (!selectedFile) {
        setErrorMessage('Please select a payment proof file before placing the order.');
        setIsOpenErrorModal(true);
        return;
      }

      // Validate the file
      const fileValidation = validateFile(selectedFile);
      if (!fileValidation.isValid) {
        setErrorMessage(fileValidation.message);
        setIsOpenErrorModal(true);
        return;
      }

      // Prepare the order data
      const orderData: NewOfflinePayment = {
        userFullName: values.userFullName,
        period: period,
        paymentMethod: paymentMethod,
        productType: productType,
        productId: productId,
      };
      
      // If this is a device order, add device-specific data
      if (productType === 'device' && productData) {
        orderData.deviceName = productData.deviceName || 'Additional Device';
        orderData.quantity = productData.quantity || 1;
        orderData.isToolDevice = productData.isToolDevice || false;
      }
      
      // Call the mutation with both data and file
      OfflinePayment({ data: orderData, file: selectedFile });
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
      // Show the appropriate bank details modal based on the payment method
      if (paymentMethod === "Zain") {
        setShowCihModal(true);
      } else if (paymentMethod === "Alrafedeen") {
        setShowTijariModal(true);
      } else if (paymentMethod === "IraqBank") {
        setShowIraqModal(true);
      }else if (paymentMethod === "AsiaPay") {
        setShowAsiaPayModal(true);
      }else if (paymentMethod === "AsiaSel") {
        setShowAsiaSelModal(true);
      }else if (paymentMethod === "FastPay") {
        setShowFastPayModal(true);
      }
    
      // Close the payment modal
      // setDetailsModalOpen(false);
    }
  }, [isSuccess, paymentMethod, setDetailsModalOpen]);

  return (
    <>
    <div className="w-full flex flex-col gap-4">
      {/* Transaction Number Section */}
      <div className="w-full flex flex-col items-center gap-3">
        <div className="w-full">
          <label className="block text-sm font-semibold text-white mb-1">
            رقم العملية
          </label>
      <input
          type="text"
          name="userFullName"
          id="userFullName"
            value={transactionNumber}
            readOnly
          placeholder={paymentMethod === "Zain" ? t('offlinePayment.Zain') : t('offlinePayment.Alrafedeen')}
            className="bg-[#19023780] border-1 border-orange text-white text-sm rounded-lg focus:ring-2 focus:ring-orange focus:border-orange block text-center w-full p-2.5 cursor-default font-mono"
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
        />
        </div>

        {formik.touched.userFullName && formik.errors.userFullName ? (
          <p className="text-orange text-sm">
            {formik.errors.userFullName}
          </p>
        ) : null}

        <div className="bg border-1 border-orange p-3 rounded-lg w-full">
          <p className="text-white text-sm font-medium mb-1">
            {t('offlinePayment.makePayment')}
          </p>
          <p className="text-white/80 text-xs">
            {t('offlinePayment.seeAccountNumber')}
          </p>
        </div>

      </div>

      {/* Payment Method Logo and File Upload Section */}
      <div className="w-full flex flex-col lg:flex-row gap-4 items-center ">
        {/* Payment Method Logo */}
        <div className="w-full lg:w-1/3 flex items-center justify-center">
          <div className="bg rounded-lg p-4 ">
            <img 
              className="w-full max-w-[150px] rounded-lg" 
              src={paymentMethod === "Zain" && "https://stock-pik.com/tools/Zain%20Cash.webp" || paymentMethod === "Alrafedeen" && "https://stock-pik.com/tools/Al%20Rafidain%20Bank.webp" || paymentMethod === "AsiaPay" && "https://www2.0zz0.com/2025/07/02/22/577308638.png" || paymentMethod === "IraqBank" && "https://www2.0zz0.com/2025/07/02/22/854022167.png" || paymentMethod === "FastPay" && "https://stock-pik.com/tools/Al%20Rafidain%20Bank.webp" || paymentMethod === "AsiaSel" && "https://www2.0zz0.com/2025/07/02/22/854022167.png"} 
              alt={paymentMethod} 
            />
          </div>
        </div>

        {/* File Upload Section */}
        <div className="w-full lg:w-2/3">
          <div className="mb-2">
            <label className="block text-sm font-semibold text-white mb-2">
              إثبات الدفع
            </label>
            <div 
              className={`w-full flex justify-center border-1 border-dashed rounded-xl transition-all duration-300 cursor-pointer ${
                isDragging 
                  ? 'border-[#00c48c] bg-[#00c48c]/10 scale-[1.02] shadow-lg shadow-[#00c48c]/20' 
                  : 'border-[#00c48c] hover:bg/80'
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={handleBoxClick}
            >
              <div className="space-y-4 text-center w-full h-full rounded-xl bg p-6 min-h-[200px] flex flex-col items-center justify-center">
          <input
            ref={fileInputRef}
            id="file-upload"
            name="file-upload"
            type="file"
            className="hidden"
            accept="image/*,.pdf"
            onChange={handleFileChange}
            disabled={isUploading}
          />
          
          {!selectedFile ? (
            <>
              <div className={`transition-all duration-300 ${isDragging ? 'scale-110' : ''}`}>
                <svg
                  className={`mx-auto ${isDragging ? 'text-[#00c48c]' : 'text-orange'} transition-colors duration-300`}
                  width="48"
                  height="48"
                  stroke="currentColor"
                  fill="none"
                  viewBox="0 0 48 48"
                  aria-hidden="true"
                >
                  <path
                    d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <div className="flex flex-col items-center gap-2 mt-3">
                <p className={`text-sm font-semibold transition-colors duration-300 ${
                  isDragging ? 'text-[#00c48c]' : 'text-white'
                }`}>
                  {isDragging ? t('offlinePayment.dropFile') || 'Drop file here' : t('offlinePayment.chooseImage')}
                </p>
                {/* <p className="text-xs text-white/70">
                  {t('offlinePayment.dragDrop') || 'Click or drag & drop'}
                </p> */}
                <p className="text-xs text-white/60 mt-1">
                  PNG, JPG, PDF (max 5MB)
                </p>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center gap-3 w-full">
              <div className={`p-3 rounded-full ${
                selectedFile.type?.startsWith('image/') 
                  ? 'bg-green-500/20' 
                  : 'bg-blue-500/20'
              }`}>
                {selectedFile.type?.startsWith('image/') ? (
                  <svg className="w-8 h-8 text-[#00c48c]" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="w-8 h-8 text-[#00c48c]" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              <div className="flex flex-col items-center gap-1 w-full px-2">
                <p className="text-sm font-medium text-[#00c48c] text-center truncate w-full">
                  {selectedFile.name}
                </p>
                <p className="text-xs text-gray-400">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedFile(null);
                  setUploadStatus(null);
                  if (fileInputRef.current) fileInputRef.current.value = '';
                }}
                className="text-xs text-orange transition-colors mt-2 px-3 py-1 rounded-md hover:bg-orange/10"
              >
                تغيير صورة الايصال
              </button>
            </div>
          )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Product Details and Submit Button */}


      <form noValidate onSubmit={formik.handleSubmit} className="w-full">
          <LoadingButton
            isDisabled={isPaying || !selectedFile}
            isLoading={isPaying}
            className={`w-full flex items-center justify-center text-sm font-bold text-white rounded-lg gap-2 px-4 py-2.5 transition-all ${
              !selectedFile ? 'bg-[#00c48c80] cursor-not-allowed' : 'bg-[#00c48c] hover:bg-[#00c48c]/90 hover:shadow-lg'
            }`}
            loadingPaddingX={28.5}
            onClick={() => { }}
            children={t('offlinePayment.placeOrder')}
          />
        </form>
      <div className="w-full flex flex-col gap-3">
        <ProductDetail 
          productType={productType} 
          productData={{
            ...productData,
            total_price: productType === 'device' 
              ? (productData?.pack_price * (productData?.quantity || 1)) 
              : productData?.total_price
          }} 
          period={period} 
          currency="$" 
        />

      

        {!selectedFile && (
          <p className="text-orange text-sm text-center mt-1 font-medium">
            {t('offlinePayment.SelectProof')}
          </p>
        )}
            </div>
    </div>



      <ToolErrorModal
        title={t('offlinePayment.failedToOrder')}
        message={errorMessage}
        modalOpen={openErrorModal}
        setModalOpen={setIsOpenErrorModal}
      />

      {/* CIH Bank Order Details Modal */}
      <CihBankOrderDetailsInfoModalForPlans
        modalOpen={showCihModal}
        setModalOpen={setShowCihModal}
        packDetails={{
          isDevice: productType === 'device',
          pack_name: productType === 'device' ? productData?.deviceName || 'Additional Device' : productData?.pack_name || productData?.tool_name,
          pack_price: productType === 'device' ? productData?.pack_price / (productData?.quantity || 1) : productData?.pack_price,
          monthly_price: productType === 'device' ? productData?.pack_price : discountedMonthlyPrice,
          yearly_price: productType === 'device' ? productData?.pack_price * 12 : discountedYearlyPrice,
          period: period || 'month', // Ensure period is always set, default to 'month'
          quantity: productType === 'device' ? productData?.quantity || 1 : 1,
         
        }}
      />

      {/* Tijari Bank Order Details Modal */}
      <TijariOrderDetailsInfoModalForPlans
        modalOpen={showTijariModal}
        setModalOpen={setShowTijariModal}
        packDetails={{
          isDevice: productType === 'device',
          pack_name: productType === 'device' ? productData?.deviceName || 'Additional Device' : productData?.pack_name || productData?.tool_name,
          pack_price: productType === 'device' ? productData?.pack_price / (productData?.quantity || 1) : productData?.pack_price,
          monthly_price: discountedMonthlyPrice,
          yearly_price: discountedYearlyPrice,
          period: period || 'month',
          quantity: productType === 'device' ? productData?.quantity || 1 : 1
        }}
      />
      {/* Tijari Bank Order Details Modal */}
      <IraqBankOrderDetailsInfoModalForPlans
        modalOpen={showIraqModal}
        setModalOpen={setShowIraqModal}
        packDetails={{
          isDevice: productType === 'device',
          pack_name: productType === 'device' ? productData?.deviceName || 'Additional Device' : productData?.pack_name || productData?.tool_name,
          pack_price: productType === 'device' ? productData?.pack_price / (productData?.quantity || 1) : productData?.pack_price,
          monthly_price: discountedMonthlyPrice,
          yearly_price: discountedYearlyPrice,
          period: period || 'month',
          quantity: productType === 'device' ? productData?.quantity || 1 : 1
        }}
      />
      {/* Tijari Bank Order Details Modal */}
      <AsiaPayOrderDetailsInfoModalForPlans
        modalOpen={showAsiaPayModal}
        setModalOpen={setShowAsiaPayModal}
        packDetails={{
          isDevice: productType === 'device',
          pack_name: productType === 'device' ? productData?.deviceName || 'Additional Device' : productData?.pack_name || productData?.tool_name,
          pack_price: productType === 'device' ? productData?.pack_price / (productData?.quantity || 1) : productData?.pack_price,
          monthly_price: discountedMonthlyPrice,
          yearly_price: discountedYearlyPrice,
          period: period || 'month',
          quantity: productType === 'device' ? productData?.quantity || 1 : 1
        }}
      />
      {/* Tijari Bank Order Details Modal */}
      <FastPayOrderDetailsInfoModalForPlans
        modalOpen={showFastPayModal}
        setModalOpen={setShowFastPayModal}
        packDetails={{
          isDevice: productType === 'device',
          pack_name: productType === 'device' ? productData?.deviceName || 'Additional Device' : productData?.pack_name || productData?.tool_name,
          pack_price: productType === 'device' ? productData?.pack_price / (productData?.quantity || 1) : productData?.pack_price,
          monthly_price: discountedMonthlyPrice,
          yearly_price: discountedYearlyPrice,
          period: period || 'month',
          quantity: productType === 'device' ? productData?.quantity || 1 : 1
        }}
      />
      {/* Tijari Bank Order Details Modal */}
      <AsiaSelOrderDetailsInfoModalForPlans
        modalOpen={showAsiaSelModal}
        setModalOpen={setShowAsiaSelModal}
        packDetails={{
          isDevice: productType === 'device',
          pack_name: productType === 'device' ? productData?.deviceName || 'Additional Device' : productData?.pack_name || productData?.tool_name,
          pack_price: productType === 'device' ? productData?.pack_price / (productData?.quantity || 1) : productData?.pack_price,
          monthly_price: discountedMonthlyPrice,
          yearly_price: discountedYearlyPrice,
          period: period || 'month',
          quantity: productType === 'device' ? productData?.quantity || 1 : 1
        }}
      />
      
    </>
  );
}

export default OfflinePayment;