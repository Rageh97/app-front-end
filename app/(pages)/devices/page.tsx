"use client"
import React, { useEffect, useState } from 'react'
import axios from 'axios';
import { useMyInfo } from "@/utils/user-info/getUserInfo";
import { useGetDevices } from "@/hooks/useGetDevices";
import { Check, Copy } from "lucide-react";
import DeviceInfo from '@/components/devicesInfo';  
import { UserRound, ShipWheel, Cpu, Clock, UsersRound, LockKeyhole, LogOut, CirclePlus, CircleMinus } from 'lucide-react'
import PaymentModal from '@/components/Modals/PaymentModal';
import CihBankOrderDetailsInfoModalPlans from '@/components/Modals/CihBankOrderDetailsInfoModalForPlans';
import TijariBankOrderDetailsInfoModalPlans from '@/components/Modals/TijariBankOrderDetailsInfoModalForPlans';
import { toast, Toaster } from 'react-hot-toast';
import { fullDateTimeFormat } from '@/utils/timeFormatting';
import { useTranslation } from 'react-i18next';

// Define the Period type to match PaymentModal's expected type
type Period = "month" | "year" | "day";

interface DeviceData {
  deviceName: string;
  device_name?: string;
  quantity: number;
  product_type: string;
  pack_id?: number;
  tool_id?: number;
  pack_name?: string;
  tool_name?: string;
  pack_price?: number;
  tool_price?: number;
  total_price?: number;
  total_price_mad?: number;
  isDevice?: boolean;
  isToolDevice?: boolean;
  paymentMethod?: "cih" | "tijari";
}

const Page = () => {
  const [number, setNumber] = useState(1);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [deviceData, setDeviceData] = useState<DeviceData>({ deviceName: "Additional Device", quantity: 1, product_type: 'device' });
  const [isCihModalOpen, setIsCihModalOpen] = useState(false);
  const [isTijariModalOpen, setIsTijariModalOpen] = useState(false);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [logoutSuccess, setLogoutSuccess] = useState<{[key: string]: boolean}>({});
  const { t } = useTranslation();
  
  const { 
    devices = [], 
    active_sessions = [], 
    isLoading: isDevicesLoading, 
    error: devicesError,
    refetch: refetchDevices 
  } = useGetDevices();

// ........................
const {data} = useMyInfo()








  
  const handleIncrement = () => {
    if (number < 10) {
      setNumber(number + 1);
    }
  };

  const handleDecrement = () => {
    if (number > 1) {
      setNumber(number - 1);
    }
  };
    

  const handleLogoutDevice = async (deviceToken: string) => {
    try {
      const token = localStorage.getItem('a');
      // const clientId = global.clientId1328; 
      
      // if (!token || !clientId) {
      //   throw new Error('No authentication token or client ID found');
      // }

      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/devices/logout`, 
        { deviceToken },
        { 
          headers: { 
            'Authorization': token,
            'User-Client': global.clientId1328
          } 
        }
      );

      
        refetchDevices();
       
        toast.success('Device logged out successfully');
      
    } catch (error: any) {
      toast.error('You already logged out !');
    }
  };
  // ...............................................


  return (
    <>
    <Toaster
      position="top-right"
      reverseOrder={false}
    />
    <div className="mt-20 flex flex-col items-center">
      <div className='flex items-center justify-center'>

       <h2 className="px-10 lg:px-30 text-center w-80 lg:w-full py-3 text-xl lg:text-4xl text-white bg-[linear-gradient(135deg,_#4f008c,_#35214f,_#35214f)] inner-shadow rounded-2xl"> {t('devices.devicesTitle')}  </h2>
      </div>
      {!data?.userPacksData?.some(pack => pack.isActive) && !data?.userToolsData?.some(tool => tool.isActive) && (
        <div className="bg-red text-xl text-white p-4 rounded-lg mt-5">
          {t('devices.needSubscription')}
        </div>
      )}
      {!data?.userPacksData?.some(pack => pack.isActive) && devices?.some(device => device.endedAt && new Date(device.endedAt) < new Date()) && (
        <div className="bg-orange text-xl text-white p-4 rounded-lg mt-5">
          {t('devices.deviceRenew')}
        </div>
      )}
      {data?.userPacksData?.some(pack => pack.isActive) && devices?.length >= 5 && 
       !devices?.some(device => device.endedAt && new Date(device.endedAt) < new Date()) && (
        <div className="bg-red text-xl text-white p-4 rounded-lg mt-5">
         {t('devices.deviceLimitReached')}
        </div>
      )}
       <div className="flex items-center justify-center  gap-8 flex-wrap mt-20">
       {/* Pack Devices Section */}
       {data?.userPacksData?.some(pack => pack.isActive) && devices?.filter(device => !device.endedAt || new Date(device.endedAt) >= new Date()).length < 5 && (
        <div className="flex flex-col items-center shadow-lg w-[250px] bg-[linear-gradient(135deg,_#4f008c,_#190237,_#190237)] rounded-xl px-5 py-3 gradient-border-Qs gap-3">
        <UsersRound className="text-orange w-[80%] h-[80%]"/>
        
       
          <div  className="w-full">
          
          
          </div>
      
        <div className='text-white font-bold text-xl mb-3'>
          أضف جهاز للباقة
        </div>
       
        <div className="flex items-center justify-between gap-5 w-full  mb-3">
          <button onClick={handleDecrement} className=" px-2 py-2 text-orange   font-bold   cursor-pointer  " disabled={number <= 0}>
          <CircleMinus size={30}/>
          </button>
          <p className="text-orange bg-[#35214f] inner-shadow rounded-xl px-5 py-2 font-bold text-2xl">
            {number}
          </p>
          <button onClick={handleIncrement} className=" px-2 py-2 text-orange   font-bold   cursor-pointer " disabled={number >= 10}>
          <CirclePlus size={30}/>
          </button>
       </div>
        <div className="flex items-center justify-center  w-[80%]  bg-[linear-gradient(135deg,_#4f008c,_#190237,_#190237)] skew-x-[-50deg] rounded-[15px] gradient-border-packet text-white">
         
          <button 
         
            onClick={() => {
              if (data.userPacksData && data.packsData) {
                const userPack = data.packsData.find((pack: any) => pack.pack_id === data.userPacksData[0]?.pack_id);
                if (userPack) {
                  // Prepare the device data for the payment modal
                  const additionalDevicePrice = userPack.additional_device_price;
                  const totalPrice = additionalDevicePrice * number;
                  setDeviceData({
                    deviceName: `${number} Additional Device${number > 1 ? 's' : ''} for ${userPack.pack_name}`,
                    device_name: `${number} Additional Device${number > 1 ? 's' : ''} for ${userPack.pack_name}`,
                    quantity: number,
                    product_type: 'device',
                    pack_id: userPack.pack_id,
                    pack_name: userPack.pack_name,
                    pack_price: additionalDevicePrice,
                    total_price: totalPrice,
                    total_price_mad: totalPrice * 10,
                    isDevice: true
                  });
                  setIsPaymentModalOpen(true);
                }
              }
            }}
            className="skew-x-[50deg] px-3 py-2 flex items-center gap-4 text-2xl font-bold"
          >
            Buy   <span className="text-[#00c48c] font-bold text-lg">{data?.userPacksData && data?.packsData ? (data?.packsData.find((pack: any) => pack.pack_id === data?.userPacksData[0]?.pack_id)?.additional_device_price * number)?.toLocaleString('de-DE') : 'N/A'} IQD</span>
          </button>
       </div>
        
       
       </div>
     
          )}

       {/* Tool Devices Section */}
       {data?.userToolsData?.some(tool => tool.isActive) && devices?.filter(device => !device.endedAt || new Date(device.endedAt) >= new Date()).length < 11 && (
        <div className="flex flex-col items-center shadow-lg w-[250px] bg-[linear-gradient(135deg,_#4f008c,_#190237,_#190237)] rounded-xl px-5 py-3 gradient-border-Qs gap-3">
        <UsersRound className="text-orange w-[80%] h-[80%]"/>
        
       
          <div  className="w-full">
          
          
          </div>
      
        <div className='text-white font-bold text-xl mb-3'>
          أضف جهاز للأداة
        </div>
       
        <div className="flex items-center justify-between gap-5 w-full  mb-3">
          <button onClick={handleDecrement} className=" px-2 py-2 text-orange   font-bold   cursor-pointer  " disabled={number <= 0}>
          <CircleMinus size={30}/>
          </button>
          <p className="text-orange bg-[#35214f] inner-shadow rounded-xl px-5 py-2 font-bold text-2xl">
            {number}
          </p>
          <button onClick={handleIncrement} className=" px-2 py-2 text-orange   font-bold   cursor-pointer " disabled={number >= 10}>
          <CirclePlus size={30}/>
          </button>
       </div>
        <div className="flex items-center justify-center  w-[80%]  bg-[linear-gradient(135deg,_#4f008c,_#190237,_#190237)] skew-x-[-50deg] rounded-[15px] gradient-border-packet text-white">
         
          <button 
         
            onClick={() => {
              if (data.userToolsData && data.toolsData) {
                // Find the first active tool
                const activeTool = data.userToolsData.find((ut: any) => ut.isActive);
                if (activeTool) {
                  const toolInfo = data.toolsData.find((t: any) => t.tool_id === activeTool.tool_id);
                  if (toolInfo) {
                    const additionalDevicePrice = toolInfo.additional_device_price;
                    const totalPrice = additionalDevicePrice * number;
                    setDeviceData({
                      deviceName: `${number} Additional Device${number > 1 ? 's' : ''} for ${toolInfo.tool_name}`,
                      device_name: `${number} Additional Device${number > 1 ? 's' : ''} for ${toolInfo.tool_name}`,
                      quantity: number,
                      product_type: 'device',
                      tool_id: toolInfo.tool_id,
                      tool_name: toolInfo.tool_name,
                      tool_price: additionalDevicePrice,
                      total_price: totalPrice,
                      total_price_mad: totalPrice * 10,
                      isDevice: true,
                      isToolDevice: true
                    });
                    setIsPaymentModalOpen(true);
                  }
                }
              }
            }}
            className="skew-x-[50deg] px-3 py-2 flex items-center gap-4 text-2xl font-bold"
          >
            Buy   <span className="text-[#00c48c] font-bold text-lg">{data?.userToolsData && data?.toolsData ? (() => {
              const activeTool = data.userToolsData.find((ut: any) => ut.isActive);
              if (activeTool) {
                const toolInfo = data.toolsData.find((t: any) => t.tool_id === activeTool.tool_id);
                return toolInfo ? (toolInfo.additional_device_price * number)?.toLocaleString('de-DE') : 'N/A';
              }
              return 'N/A';
            })() : 'N/A'} IQD</span>
          </button>
       </div>
        
       
      </div>
     
          )}
     
      {isDevicesLoading ? (
        <div className="flex justify-center items-center">
          <p className="text-white">Loading devices...</p>
        </div>
      ) : devicesError ? (
        <div className="bg-red-900 text-white p-4 rounded-lg">
          <p>Error loading devices:</p>
          <pre className="text-xs overflow-x-auto">{devicesError}</pre>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 bg-orange-500 text-white px-4 py-2 rounded"
          >
            Retry
          </button>
        </div>
      ) : devices?.length === 0 ? (
        <div className="bg-purple-900 text-white p-4 rounded-lg">
          {/* <p>No devices connected</p> */}
        </div>
      ) : (
        <div className="flex items-center flex-wrap justify-center gap-8">
          { devices?.map((device) => {
            // Skip main devices
            if (device.isMainDevice === true) return null;
            
            // Skip expired devices
            if (new Date(device.endedAt) < new Date()) return null;
            
            // Check if user has active subscription (pack OR tool)
            const hasActivePack = data?.userPacksData?.some((p) => p.isActive === true);
            const hasActiveTool = data?.userToolsData?.some((t) => t.isActive === true);
            
            // Hide devices if user has no active subscription at all
            if (!hasActivePack && !hasActiveTool) return null;
            
            return (
            <div 
              key={device.device_id} 
              className="flex flex-col items-center shadow-lg w-[250px] bg-[linear-gradient(135deg,_#4f008c,_#190237,_#190237)] rounded-xl px-4 gradient-border-Qs gap-3"
            >
                  <img src={active_sessions?.find((session) => session.device_token === device.device_token) ? "/images/device-g.png" : "/images/device-o.png"} alt="device" className="w-35" />

              {/* Device Name & Type */}
              <div className="flex flex-col items-center w-full mb-2">
                <p className="text-white font-bold text-lg">{device.device_name}</p>
                {device.pack && (
                  <p className="text-orange text-xs">Pack: {device.pack.pack_name}</p>
                )}
                {device.tool && (
                  <p className="text-green-400 text-xs">Tool: {device.tool.tool_name}</p>
                )}
              </div>

              <div className="flex items-center justify-between mb-3 w-full">
                <Clock size={30} className="text-orange "/>
                <p className="text-white text-md flex flex-col items-start text-center bg-gradient-to-r from-purple-900 via-purple-900 to-[#190237] py-1 rounded-lg">
                <span className='text-orange font-bold text-xs'>{t('devices.expiredAt')}:</span>  {fullDateTimeFormat(device.endedAt) || ''}
                </p>
              </div>
              
              <div className="flex items-center justify-between mb-3 w-full">
                <LockKeyhole size={30} className="text-orange"/>
                <div 
                  onClick={() => {
                    if (device.device_token) {
                      navigator.clipboard.writeText(device.device_token);
                      setCopiedToken(device.device_token);
                      setTimeout(() => setCopiedToken(null), 2000);
                    }
                  }}
                  className="relative w-[80%] group cursor-pointer"
                >
                  <div className="text-white break-words text-center bg-gradient-to-r from-purple-900 via-purple-900 to-[#190237] py-1 px-3 rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
                    {copiedToken === device.device_token ? (
                      <>
                        <Check size={16} className="text-green-400" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy size={16} className="text-gray-300 group-hover:opacity-100 opacity-0 transition-opacity" />
                        <span className="truncate">{device.device_token || ''}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              {/* ............. */}
              <div className="flex items-center justify-center w-[80%] mb-3 bg-[linear-gradient(135deg,_#4f008c,_#190237,_#190237)] skew-x-[-50deg] rounded-[15px] gradient-border-packet text-white">
                <button 
                  onClick={() => handleLogoutDevice(device.device_token)}
                  className="skew-x-[50deg] px-3 py-2 flex items-center gap-2 text-md font-bold"
                >
                  {active_sessions?.find(session => 
  session.device_token === device.device_token
) ? t('devices.logout') : t('devices.loggedOut')}

                  <LogOut className="text-orange" />
                </button>
              </div>
              {device.isMainDevice && (
                <div className="text-green-400 text-center font-bold">
                  Main Device
                </div>
              )}
            </div>
         );
          })}
        </div>
      )}
   
   
   
  
    </div>
    <div className="px-2">
    <DeviceInfo/>
    </div>
    </div>
    

    {/* Connected Devices Section */}


      {/* Payment Modal */}
      {isPaymentModalOpen && (data.userPacksData || data.userToolsData) && (data.packsData || data.toolsData) && (
        <PaymentModal
          modalOpen={isPaymentModalOpen}
          setModalOpen={setIsPaymentModalOpen}
          period="month" /* Using month as the period type */
          productId={deviceData.isToolDevice ? (deviceData.tool_id || 0) : (deviceData.pack_id || 0)}
          productData={{
            ...deviceData,
            /* Add these properties to make it compatible with the ProductDetail component */
            pack_name: deviceData.isToolDevice ? deviceData.tool_name : deviceData.pack_name,
            pack_price: deviceData.total_price / (deviceData.quantity || 1),
            quantity: deviceData.quantity,
            isToolDevice: deviceData.isToolDevice
          }}
          productType="device" /* Now device is supported in the PaymentModal */
          onBuySuccess={(paymentMethod: "cih" | "tijari") => {
            setIsPaymentModalOpen(false);
            setDeviceData(prevData => ({
              ...prevData,
              paymentMethod
            }));
            
            // Open the corresponding bank details modal
            if (paymentMethod === "cih") {
              setIsCihModalOpen(true);
            } else if (paymentMethod === "tijari") {
              setIsTijariModalOpen(true);
            }
            
            // Refresh data to show the new device
            // refetch();
          }}
        />
      )}
      
      {/* CIH Bank Details Modal */}
      <CihBankOrderDetailsInfoModalPlans
        modalOpen={isCihModalOpen}
        setModalOpen={setIsCihModalOpen}
        packDetails={{
          isDevice: true,
          deviceName: deviceData.deviceName,
          pack_name: deviceData.pack_name,
          pack_price: deviceData.pack_price,
          total_price: deviceData.total_price,
          total_price_mad: deviceData.total_price_mad,
          quantity: deviceData.quantity
        }}
      />
      
      {/* Tijari Bank Details Modal */}
      <TijariBankOrderDetailsInfoModalPlans
        modalOpen={isTijariModalOpen}
        setModalOpen={setIsTijariModalOpen}
        packDetails={{
          isDevice: true,
          deviceName: deviceData.deviceName,
          pack_name: deviceData.pack_name,
          pack_price: deviceData.pack_price,
          total_price: deviceData.total_price,
          total_price_mad: deviceData.total_price_mad,
          quantity: deviceData.quantity
        }}
      />
    </>
    

    )
}

export default Page