import { Dialog } from "@headlessui/react";
import { NewToolsDto } from "@/types/tools/new-tools-dto";
import { useTranslation } from 'react-i18next';
import { useState, ChangeEvent } from 'react';
import axios from 'axios';

type Period = "month" | "year" | "day";

interface CihBankOrderDetailsInfoModalProps {
  toolData: NewToolsDto;
  modalOpen: boolean;
  period: Period;
  setModalOpen: Function;
}

const CihBankOrderDetailsInfoModal: React.FC<
  CihBankOrderDetailsInfoModalProps
> = ({ modalOpen, setModalOpen, period, toolData }) => {
  const { t } = useTranslation();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<{success: boolean; message: string} | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

  

  return (
    <>
    <Dialog
      open={modalOpen}
      onClose={() => {
        setModalOpen(false);
      }}
      className="fixed top-0 left-0 z-999999 flex h-full min-h-screen w-full items-center justify-center bg-black/90 px-4 py-5"
    >
      <Dialog.Panel className="w-full max-w-[830px] max-h-[90vh] overflow-y-auto text-center dark:bg-boxdark">
        <div className="flex justify-center items-start overflow-hidden w-full min-h-[400px] rounded-lg bg-[linear-gradient(180deg,_#00c48c,_#4f008c)] relative">
          <div
            className="absolute z-999999 top-4 right-4 cursor-pointer"
            onClick={() => {
              setModalOpen(false);
            }}
          >
            <img src="/images/close.png" className="max-w-4" alt="close" />
          </div>

          <div
            className="px-4 bg-[#00c48c] inner-shadow py-2 text-start text-sm font-bold text-white absolute top-5 rounded-lg"
            role="alert"
          >
            {t('bankDetails.orderSubmitted')}
          </div>

          <div className="w-full flex items-start flex-col px-8 ">
            <p className="font-bold text-white">{t('bankDetails.ourBankDetails')}</p>
            <p className="text-black">{t('bankDetails.sendAmount')}</p>
            <div
              className="w-full flex gap-5 justify-between px-3 py-4 text-start text-sm text-white rounded-lg border-2 border-orange bg-[#190237]"
              role="alert"
            >
              <div className="">
                <p className="text-orange">{t('bankDetails.bank')}</p>
                <p className="font-bold mt-1 ">CIH BANK</p>
              </div>
              <div>
                <p className="text-orange">{t('bankDetails.accountNumber')}</p>
                <p className="font-bold mt-1">5329520211013900</p>
              </div>
              <div>
                <p className="text-orange">{t('bankDetails.accountName')}</p>
                <p className="font-bold mt-1">ISMAIL IKINE</p>
              </div>
              <div>
                <p className="text-orange">{t('bankDetails.bic')}</p>
                <p className="font-bold mt-1">CIHMMAMC</p>
              </div>
            </div>

            <p className="font-bold text-white">{t('bankDetails.orderDetails')}</p>
            <div
              className="w-full my-2 px-6 py-4 text-start text-sm text-white rounded-lg border-2 border-orange bg-[#190237]"
              role="alert"
            >
              <div>
                <span className="font-bold text-orange">{t('bankDetails.product')}</span>{" "}
                {period === "month"
                  ? `${t('bankDetails.monthOf')} ${toolData?.tool_name}`
                  : null}
                {period === "year"
                  ? `1 ${t('bankDetails.yearOf')} ${toolData?.tool_name}`
                  : null}
                {period === "day"
                  ? `1 ${t('bankDetails.dayOf')} ${toolData?.tool_name}`
                  : null}
              </div>

              <div className="mt-1">
                <span className="font-bold text-orange">{t('bankDetails.total')}</span>{" "}
                {period === "month"
                  ? toolData?.tool_month_price * 10 + " MAD"
                  : null}
                {period === "year"
                  ? toolData?.tool_year_price * 10 + " MAD"
                  : null}
                {period === "day"
                  ? toolData?.tool_day_price * 10 + " MAD"
                  : null}
              </div>
            </div>
          </div>
          <p className="absolute has-tooltip bottom-4 text-orange flex cursor-pointer justify-center items-center gap-1">
            {t('bankDetails.contactUs')}{" "}
            <span className="text-[#1f9c4d] font-bold">{t('bankDetails.whatsapp')}</span>
            <img
              className="max-w-[18px]"
              src="/images/whatsapp.png"
              alt="whatsapp"
            />
            <span className="tooltip rounded p-1 bg-black text-white -mt-[55px]">
              +9647702930873
            </span>
          </p>
        </div>
       
      </Dialog.Panel>
    
    </Dialog>
        
  </>);
};

export default CihBankOrderDetailsInfoModal;
