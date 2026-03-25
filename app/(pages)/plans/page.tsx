"use client";

import React, { FunctionComponent, useEffect, useMemo, useState } from "react";
import { useMyInfo } from "@/utils/user-info/getUserInfo";
import PackCard from "@/components/PackCard";
import ModalPayment from "@/components/Modals/PaymentModal";
import { CircleCheckBig, CircleX } from "lucide-react";
import CihBankOrderDetailsInfoModalPlans from "@/components/Modals/CihBankOrderDetailsInfoModalForPlans";
import TijariOrderDetailsInfoModalPlans from "@/components/Modals/TijariBankOrderDetailsInfoModalForPlans";
import { useTranslation } from 'react-i18next';

type Props = {
  params: { clientId: string };
};

const PlansPage: FunctionComponent<Props> = ({ params: { clientId } }) => {
  const { data, isLoading, isFetching, isError, refetch } = useMyInfo();
  const [openCihDetailsModal, setOpenCihDetailsModal] =
    useState<boolean>(false);
  const [openTijariDetailsModal, setOpenTijariDetailsModal] =
    useState<boolean>(false);
  const [openPaymentModal, setOpenPaymentModal] = useState<boolean>(false);
  const [packDetails, setPackDetails] = useState<any>();
  const [selectedPeriod, setSelectedPeriod] = useState<'month' | 'year'>('month');
  const {t} = useTranslation();

  useEffect(() => {
    document.title = t('plans.pageTitle');
  }, [t])

  return (
    <>
    
      <h2 className="text-title-sm2 text-center mt-10 px-3 pb-7 font-bold text-white dark:text-white">
        {t('plans.pageTitle')}
      </h2>
      <div className="flex justify-center mb-6">
        <div className="flex items-center border-1 border-[#ff7702] bg-[#190237] rounded-xl cursor-pointer w-fit overflow-hidden">
          {(['month', 'year'] as const).map((period) => (
            <div
              key={period}
              onClick={() => setSelectedPeriod(period)}
              className={`px-4 lg:px-6 py-2 lg:py-3 text-sm sm:text-2xl lg:text-2xl cursor-pointer transition-colors ${
                selectedPeriod === period
                  ? 'bg-[#ff7702] text-white font-bold'
                  : 'text-white hover:bg-[#2a0854]'
              }`}
            >
              {period === 'month' ? t('packs.monthly') : t('packs.annual')}
            </div>
          ))}
        </div>
      </div>
      <div className="w-full h-full flex justify-center gap-20 flex-wrap pt-3">
        {
          data && data?.packsData?.map((item: any, index: number) =>
            <PackCard
              key={index}
              packTitle={t('plans.toolsIncluded')}
              title={item.pack_name}
              packPrice={selectedPeriod === 'month' ? item.monthly_price : item.yearly_price}
              period={selectedPeriod}
              packData={item}
              toolsData={data?.toolsData}
              onClick={() => {
                setPackDetails(item);
                setOpenPaymentModal(true);
              }}
            />
          )
        }
      </div>

      {/* Comparison Table */}
      <div className="w-full overflow-x-auto px-4 mt-30 mb-8 flex flex-col items-center">
        <h2 className="px-10 mb-10 lg:px-10 text-center w-80 lg:w-[45%] py-3 text-xl lg:text-4xl text-white bg-[linear-gradient(135deg,_#4f008c,_#35214f,_#35214f)] inner-shadow rounded-2xl">
          {t('plans.moreInfo')}
        </h2>
        <div className="w-full max-w-6xl mx-auto rounded-lg ">
          <table className="w-full text-white table-auto overflow-x-auto">
            <thead>
              <tr className="bg-[linear-gradient(135deg,rgba(79,0,140,0.54),rgba(25,2,55,0.5),rgba(25,2,55,0.3))]">
                <th className="py-4 px-6 font-bold text-orange text-center border-2 border-[#ff7702] text-xl xl:text-2xl">{t('plans.tools')}</th>
                {data?.packsData?.map((pack: any, index: number) => (
                  <th key={index} className="py-4 px-6 font-bold text-center border-[#ff7702] border-2 text-xl xl:text-2xl">
                    {pack.pack_name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(() => {
                const toolsByName = new Map<string, any[]>();
                data?.toolsData?.forEach((tool: any) => {
                  const name = tool.tool_name.trim();
                  if (!toolsByName.has(name)) toolsByName.set(name, []);
                  toolsByName.get(name)!.push(tool);
                });

                return Array.from(toolsByName.entries()).map(([toolName, tools], index) => (
                  <tr key={index} className="hover:bg-[#2a0854] transition-colors bg-[linear-gradient(135deg,rgba(79,0,140,0.54),rgba(25,2,55,0.5),rgba(25,2,55,0.3))]">
                    <td className="py-3 px-6 font-bold text-center border-2 border-[#ff7702] text-md xl:text-2xl">
                      {toolName}
                    </td>
                    {data?.packsData?.map((pack: any, packIndex: number) => {
                      const packToolIds = JSON.parse(pack.pack_tools);
                      // Included if any of the tool IDs for this name group are in the pack
                      const isIncluded = tools.some(t => packToolIds.includes(t.tool_id));
                      return (
                        <td key={packIndex} className="py-3 px-6 text-center border-[#ff7702] border-2 text-md xl:text-2xl">
                          <span title={isIncluded ? t('plans.included') : t('plans.notIncluded')}>
                            {isIncluded ? (
                              <CircleCheckBig className="inline-block" strokeWidth={3} size={20} color={"#00c48c"} />
                            ) : (
                              <CircleX className="inline-block" strokeWidth={3} size={20} color={"#ff7702"} />
                            )}
                          </span>
                        </td>
                      );
                    })}
                  </tr>
                ));
              })()}
            </tbody>
          </table>
        </div>
      </div>

      {/* .................................................................. */}

      {/* <PlanModalPayment
        modalOpen={openPaymentModal}
        setModalOpen={setOpenPaymentModal}
        amount={amound}
        plan={plan}
        onBuySuccess={(localBank: string) => {
          setOpenPaymentModal(false);
          if (localBank === "cih") {
            setOpenCihDetailsModal(true);
          } else {
            setOpenTijariDetailsModal(true);
          }
        }}
      /> */}

      <ModalPayment
        modalOpen={openPaymentModal}
        setModalOpen={setOpenPaymentModal}
        productId={packDetails?.pack_id}
        productData={packDetails}
        productType="pack"
        period={selectedPeriod}
        onBuySuccess={(bankName: "cih" | "tijari") => {
          setOpenPaymentModal(false);
          if (bankName === "cih") {
            setOpenCihDetailsModal(true);
          } else {
            setOpenTijariDetailsModal(true);
          }
        }}
      />

      <CihBankOrderDetailsInfoModalPlans
        modalOpen={openCihDetailsModal}
        setModalOpen={setOpenCihDetailsModal}
        packDetails={packDetails}
      />

      <TijariOrderDetailsInfoModalPlans
        modalOpen={openTijariDetailsModal}
        setModalOpen={setOpenTijariDetailsModal}
        packDetails={packDetails}
      />
    </>
  );
};

export default PlansPage;
