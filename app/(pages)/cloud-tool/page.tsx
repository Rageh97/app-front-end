"use client";
import { FunctionComponent, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslation } from 'react-i18next';
import { ExternalLink, ArrowLeft, FastForward, ChevronsLeft, ChevronsRight } from "lucide-react";
import Link from "next/link";
import ReviewModal from "@/components/Modals/ReviewModal";

interface CloudToolData {
  url: string;
  toolName: string;
  toolDescription: string;
  imageUrl?: string;
}

const CloudToolPage: FunctionComponent = () => {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const [toolData, setToolData] = useState<CloudToolData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openReviewModal, setOpenReviewModal] = useState<boolean>(false);

  useEffect(() => {
    const toolId = searchParams.get('toolId');
    const toolName = searchParams.get('toolName');
    const toolUrl = searchParams.get('toolUrl');
    const toolDescription = searchParams.get('toolDescription');
    const toolImageUrl = searchParams.get('toolImage');

    if (toolId && toolName && toolUrl) {
      setToolData({
        url: toolUrl,
        toolName: toolName,
        toolDescription: toolDescription || '',
        imageUrl: toolImageUrl || undefined
      });
      setLoading(false);
    } else {
      setError('Missing tool information');
      setLoading(false);
    }
  }, [searchParams]);

  const openCloudTool = () => {
    if (toolData?.url) {
      window.open(toolData.url, '_blank');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#190237] flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (error || !toolData) {
    return (
      <div className="min-h-screen bg-[#190237] flex items-center justify-center mt-10 rounded-[30px]">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-4">{error || 'Tool not found'}</div>
          <Link href="/subscriptions" className="text-[#00c48c] hover:underline">
            Return to Subscriptions
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
    <div className="min-h-screen  items-center  text-white mt-10 rounded-[30px] px-3">
      {/* Header */}
      <div className="max-w-4xl mx-auto bg-[#190237] border-b border-[#ff7702] p-4 rounded-[30px]">
        <div className="max-w-4xl mx-auto flex items-center justify-center">
         
          <h1 className="text-xl md:text-4xl font-bold text-white text-center mb-0">
            {toolData.toolName}
          </h1>
         
        </div>
      </div>

      {/* Main Content */}
      <div dir="ltr" className="max-w-6xl mx-auto p-6">
        <div  className="bg-inherit rounded-lg p-8 text-center flex flex-col lg:flex-row items-center">
        
          
          {/* Tool Icon/Image */}
          {toolData.imageUrl ? (
            <div  className="lg:w-96 mx-auto mb-6 rounded-2xl overflow-hidden  shadow-lg">
              <img 
                src={toolData.imageUrl} 
                alt={toolData.toolName}
                className="w-full h-full object-cover"
             
              />
              {/* Fallback gradient circle (hidden by default) */}
              <div className="w-full h-full bg-gradient-to-br from-[#00c48c] to-[#4f008c] flex items-center justify-center hidden">
                <ExternalLink className="w-16 h-16 text-white" />
              </div>
            </div>
          ) : (
            <div className="w-32 h-32 mx-auto mb-6 bg-gradient-to-br from-[#00c48c] to-[#4f008c] rounded-full flex items-center justify-center">
              <ExternalLink className="w-16 h-16 text-white" />
            </div>
          )}
               <div className="bg-[linear-gradient(135deg,_#190237,_#190237,_#4f008c)] border-t-[#00c48c80] border-b-[#00c48c80] border-r-[#00c48c80] border-l-[#19023780] border h-30 w-full flex flex-col lg:flex-row items-center justify-center gap-5 rounded-tr-lg">
               <button
            onClick={openCloudTool}
            className="flex items-center gap-3 bg-[#35214f] inner-shadow text-white font-bold py-2 md:py-3 px-6 md:px-8 rounded-full text-md md:text-lg transition-all duration-300 transform hover:scale-105 shadow-lg "
          >
           
            {t('common.useTool')} <FastForward className="text-orange" />
          </button>
          <div onClick={() => setOpenReviewModal(true)} className="flex items-center gap-3 bg-[#35214f] inner-shadow text-white font-bold py-2 md:py-3 px-6 md:px-8 rounded-full text-md md:text-lg transition-all duration-300 transform hover:scale-105 shadow-lg ">
                <h1 className="">{t('common.rateTool')}</h1>
                <FastForward className="text-orange" />
            </div>
               </div>
             
          
        </div>
      </div>



      {/* ............................. */}
    <div className="flex flex-col max-w-4xl mx-auto gap-5">
    <div className="flex items-center justify-center gap-3 p-4 bg-[linear-gradient(135deg,_#190237,_#190237,_#4f008c)] gradient-border-2 rounded-xl border border-[#00c48c]/30">
      <ChevronsLeft />
            <p className="text-white text-sm">
             {t('common.note')}
            </p>
            <ChevronsRight />
          </div>
         
            <div className="flex flex-col items-center border-1 border-orange rounded-[40px] p-4 gap-4 min-h-[200px] bg-[linear-gradient(135deg,_#4f008c50,_#19023750,_#00c48c50)]">
                <h1 className="bg-[#190237] border-b border-orange rounded-[30px] px-8 py-2">{t('common.descTool')}</h1>
                  <p>{toolData?.toolDescription}</p>
            </div>
          

          

    </div>
    </div>
      <ReviewModal
      modalOpen={openReviewModal}
      setModalOpen={setOpenReviewModal}
      
    />
  </>);
};

export default CloudToolPage;
