import { Dialog } from "@headlessui/react";
import { NewToolsDto } from "@/types/tools/new-tools-dto";
import LoadingButton from "../LoadingButton";
import { checkIfImageUrl } from "@/utils/imageValidator";
import { ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import i18n from "@/i18n";

type Period = "month" | "year" | "day";

interface ToolModalDetailsProps {
  toolData: NewToolsDto;
  modalOpen: boolean;
  period: Period;
  setModalOpen: Function;
  setPeriod: Function;
  onBuy: Function;
}

const ToolModalDetails: React.FC<
  ToolModalDetailsProps & {
    setModalOpen: Function;
    setPeriod: Function;
    onBuy: Function;
  }
> = ({ modalOpen, setModalOpen, setPeriod, period, onBuy, toolData }) => {
  const { t } = useTranslation();
  const isFree = !!toolData?.isFree;

  return (
    <Dialog
      open={modalOpen}
      onClose={() => {
        setModalOpen(false);
      }}
      className="fixed top-0 left-0 z-999999 flex h-full min-h-screen w-full items-center justify-center bg-black/90 px-4 py-5"
    >
      <Dialog.Panel className="w-full max-w-[830px] h-[400px] text-center dark:bg-boxdark">
        <div className="md:flex-row flex flex-col  bg-[linear-gradient(180deg,_#00c48c,_#4f008c)] overflow-hidden w-full h-full rounded-[20px] bg-white">
          <div className="md:w-[50%] w-full  p-0 lg:p-5 md:h-full h-[100px] ">
            <img
              className="h-full w-full rounded-[20px]   border-2 border-[#ff7702]"
              src={
                checkIfImageUrl(toolData?.tool_image)
                  ? toolData?.tool_image
                  : "/images/default_image.png"
              }
              alt="image"
            />
          </div>
          <div className="md:w-[50%] w-full  flex flex-col items-center md:h-full h-[100px] md:p-7 p-1 text-center relative">
            <div
              className="absolute top-4 right-4 cursor-pointer"
              onClick={() => {
                setModalOpen(false);
              }}
            >
              <img src="/images/close.png" className="max-w-4" alt="close" />
            </div>
            <p className="bg-[#00c48c] bg-opacity-50 w-50 rounded-xl inner-shadow text-white p-1 lg:p-2 text-xl lg:text-3xl font-extrabold">
              {toolData?.tool_name}
            </p>
            <p className="text-white  font-extrabold w-full text-2xl py-2">
              {toolData?.tool_day_price
                ? "IQD " + toolData?.tool_day_price + " - "
                : "IQD " + toolData?.tool_month_price + " - "}{" "}
              {"IQD " + toolData?.tool_year_price}
            </p>
           <div className="bg-[#190237] w-full rounded-2xl p-1 border-2 border-[#ff7702]">
           <p className="text-white font-extrabold w-full text-[15px] px-2 pt-2">
              {t('toolModal.youWillGet')}
            </p>
            <div
              dangerouslySetInnerHTML={{ __html: toolData?.tool_description }}
              className="text-white font-bold w-full h-[80px] lg:h-[100px] text-[12px]"
            ></div>
           </div>
            <div className="inline-flex  mt-1 border-1 border-orange  shadow-sm" role="group">
              <button
                type="button"
                style={{
                  backgroundColor: period === "month" ? "#35214f" : "#190237",
                  
                }}
                className={`   px-2 py-1  border-r-0 text-[13px] font-medium text-white hover:bg-[#F19523] bg-transparent  `}
                onClick={() => {
                  setPeriod("month");
                }}
              >
                {t('toolModal.monthly')}
              </button>
              {toolData?.tool_day_price ? (
                <>
                  <button
                    type="button"
                    style={{
                      backgroundColor: period === "year" ? "#35214f" : "#190237",
                    }}
                    className="px-2 lg:px-5  py-1 text-[13px] font-medium text-white hover:bg-[#F19523] bg-transparent  "
                    onClick={() => {
                      setPeriod("year");
                    }}
                  >
                    {t('toolModal.annual')}
                  </button>
                  <button
                    type="button"
                    style={{
                      backgroundColor: period === "day" ? "#35214f" : "#190237",
                    }}
                    className={` px-2 lg:px-5 border-l-0 py-1 text-[13px] font-medium text-white hover:bg-[#F19523] bg-transparent  `}
                    onClick={() => {
                      setPeriod("day");
                    }}
                  >
                    {t('toolModal.trial1Day')}
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    style={{
                      backgroundColor: period === "year" ? "#F19523" : "white",
                    }}
                    className="px-5 py-3 text-[13px] font-medium text-black hover:bg-[#F19523] bg-transparent border-l-0 border border-[#ff7702] rounded-e-lg"
                    onClick={() => {
                      setPeriod("year");
                    }}
                  >
                    {t('toolModal.annual')}
                  </button>
                </>
              )}
            </div>

            <div className="flex flex-col md:flex-row items-center justify-between gap-0 md:gap-5 mt-3">
<div className="flex text-sm md:text-lg items-center justify-center border border-white font-bold text-white rounded-xl  bg-[#00c48c] gap-1 px-1 py-1">
            {isFree ? (
              <a
                className="text-sm flex items-center gap-1"
                href={toolData?.tool_url || "#"}
                target="_blank"
                rel="noopener noreferrer"
              >
                {t('toolModal.launchForFree')}
                <ChevronRight />
              </a>
            ) : (
              <>
                <LoadingButton
                  className="text-sm "
                  onClick={() => {
                    onBuy();
                  }}
                  title={t('toolModal.buyNow')}
                >
                  {t('toolModal.buyNow')}
                </LoadingButton>
                <ChevronRight />
              </>
            )}
            </div>


            {isFree ? (
              <p className="text-[#00c48c] text-md font-extrabold py-2">
                {t('toolModal.freeAccess')}
              </p>
            ) : (
              <p className="text-white text-md font-extrabold py-2 flex gap-1">
                <span>{t('toolModal.total')}</span>
                <span className="flex justify-center items-center gap-1">
                  <span className="text-[#F0D09C] text-sm line-through decoration-[#8E8E8E]">
                    {period === "month"
                      ? "IQD " + toolData?.tool_none_price_month
                      : null}
                    {period === "year"
                      ? "IQD " + toolData?.tool_none_price_year
                      : null}
                  </span>
                  <span className="text-white text-[17px]">
                    {period === "day" ? "IQD " + toolData?.tool_day_price : null}
                    {period === "month" ? "IQD " + toolData?.tool_month_price : null}
                    {period === "year" ? "IQD " + toolData?.tool_year_price : null}
                  </span>
                </span>
              </p>
            )}
           
             
           
   </div> 
          </div>
        </div>
      </Dialog.Panel>
    </Dialog>
  );
};

export default ToolModalDetails;
