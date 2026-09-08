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
      <div className="w-full min-h-screen pb-16">
        {/* Dark Mode Header */}
        <div className="hidden dark:flex items-center gap-3 border-s-4 border-[#00c48c] ps-3 mb-8 mt-6">
          <h1 className="text-xl md:text-2xl font-extrabold animate-emerald-shimmer">
            {t('devices.devicesTitle')}
          </h1>
        </div>

        {/* Light Mode Header */}
        <div className="dark:hidden flex items-center justify-center mt-10 mb-6">
          <h2 className="px-10 lg:px-30 text-center w-80 lg:w-full py-3 text-xl lg:text-4xl text-white bg-[linear-gradient(135deg,_#4f008c,_#35214f,_#35214f)] inner-shadow rounded-2xl">
            {t('devices.devicesTitle')}
          </h2>
        </div>

        {/* Alerts / Info Messages */}
        {!data?.userPacksData?.some(pack => pack.isActive) && !data?.userToolsData?.some(tool => tool.isActive) && (
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm font-bold text-center my-4 max-w-2xl mx-auto">
            {t('devices.needSubscription')}
          </div>
        )}
        {!data?.userPacksData?.some(pack => pack.isActive) && devices?.some(device => device.endedAt && new Date(device.endedAt) < new Date()) && (
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm font-bold text-center my-4 max-w-2xl mx-auto">
            {t('devices.deviceRenew')}
          </div>
        )}
        {data?.userPacksData?.some(pack => pack.isActive) && devices?.length >= 5 && 
         !devices?.some(device => device.endedAt && new Date(device.endedAt) < new Date()) && (
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm font-bold text-center my-4 max-w-2xl mx-auto">
            {t('devices.deviceLimitReached')}
          </div>
        )}

        {/* ==================== ADD DEVICES SECTION ==================== */}
        <div className="flex items-center justify-center gap-6 flex-wrap my-10">
          {/* Pack Devices Section */}
          {data?.userPacksData?.some(pack => pack.isActive) && devices?.filter(device => !device.endedAt || new Date(device.endedAt) >= new Date()).length < 5 && (
            <>
              {/* Dark Mode Card */}
              <div className="hidden dark:flex flex-col items-center w-[280px] p-6 rounded-2xl bg-[#12141F] border border-zinc-800/80 hover:border-[#00c48c]/50 shadow-xl transition-all duration-300 relative group overflow-hidden">
                <div className="absolute top-0 inset-x-1/4 h-[1px] bg-gradient-to-r from-transparent via-[#00c48c]/50 to-transparent pointer-events-none" />
                
                <div className="w-14 h-14 rounded-2xl bg-[#181B29] border border-zinc-800 flex items-center justify-center text-[#00c48c] mb-2 shadow-sm">
                  <UsersRound size={28} />
                </div>
                
                <h3 className="text-white font-bold text-base mb-1">
                  أضف جهاز للباقة
                </h3>
                <span className="text-[11px] text-zinc-400 mb-4">
                  توسيع نطاق الاستخدام لباقتك
                </span>

                {/* Counter */}
                <div className="flex items-center justify-between gap-3 w-full mb-5">
                  <button 
                    onClick={handleDecrement} 
                    className="p-2 rounded-xl bg-[#181B29] hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 transition-all disabled:opacity-40" 
                    disabled={number <= 1}
                  >
                    <CircleMinus size={22} />
                  </button>
                  <span className="flex-1 text-center py-2 rounded-xl bg-[#181B29] text-white font-mono font-bold text-xl border border-zinc-800">
                    {number}
                  </span>
                  <button 
                    onClick={handleIncrement} 
                    className="p-2 rounded-xl bg-[#181B29] hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 transition-all disabled:opacity-40" 
                    disabled={number >= 10}
                  >
                    <CirclePlus size={22} />
                  </button>
                </div>

                {/* Buy Button */}
                <button
                  onClick={() => {
                    if (data.userPacksData && data.packsData) {
                      const userPack = data.packsData.find((pack: any) => pack.pack_id === data.userPacksData[0]?.pack_id);
                      if (userPack) {
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
                  className="w-full py-2.5 px-4 rounded-xl bg-[#00c48c] hover:bg-[#00b07d] text-slate-950 font-bold text-xs sm:text-sm flex items-center justify-between shadow-md shadow-[#00c48c]/20 hover:scale-[1.02] active:scale-95 transition-all"
                >
                  <span>شراء الآن</span>
                  <span className="font-mono font-extrabold">
                    {data?.userPacksData && data?.packsData ? (data?.packsData.find((pack: any) => pack.pack_id === data?.userPacksData[0]?.pack_id)?.additional_device_price * number)?.toLocaleString('en-US') : '—'} IQD
                  </span>
                </button>
              </div>

              {/* Light Mode Card */}
              <div className="dark:hidden flex flex-col items-center shadow-lg w-[250px] bg-[linear-gradient(135deg,_#4f008c,_#190237,_#190237)] rounded-xl px-5 py-3 gradient-border-Qs gap-3">
                <UsersRound className="text-orange w-[80%] h-[80%]"/>
                <div className='text-white font-bold text-xl mb-3'>أضف جهاز للباقة</div>
                <div className="flex items-center justify-between gap-5 w-full mb-3">
                  <button onClick={handleDecrement} className="px-2 py-2 text-orange font-bold cursor-pointer" disabled={number <= 0}>
                    <CircleMinus size={30}/>
                  </button>
                  <p className="text-orange bg-[#35214f] inner-shadow rounded-xl px-5 py-2 font-bold text-2xl">{number}</p>
                  <button onClick={handleIncrement} className="px-2 py-2 text-orange font-bold cursor-pointer" disabled={number >= 10}>
                    <CirclePlus size={30}/>
                  </button>
                </div>
                <div className="flex items-center justify-center w-[80%] bg-[linear-gradient(135deg,_#4f008c,_#190237,_#190237)] skew-x-[-50deg] rounded-[15px] gradient-border-packet text-white">
                  <button 
                    onClick={() => {
                      if (data.userPacksData && data.packsData) {
                        const userPack = data.packsData.find((pack: any) => pack.pack_id === data.userPacksData[0]?.pack_id);
                        if (userPack) {
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
                    Buy <span className="text-[#00c48c] font-bold text-lg">{data?.userPacksData && data?.packsData ? (data?.packsData.find((pack: any) => pack.pack_id === data?.userPacksData[0]?.pack_id)?.additional_device_price * number)?.toLocaleString('en-US') : 'N/A'} IQD</span>
                  </button>
                </div>
              </div>
            </>
          )}

          {/* Tool Devices Section */}
          {data?.userToolsData?.some(tool => tool.isActive) && devices?.filter(device => !device.endedAt || new Date(device.endedAt) >= new Date()).length < 11 && (
            <>
              {/* Dark Mode Card */}
              <div className="hidden dark:flex flex-col items-center w-[280px] p-6 rounded-2xl bg-[#12141F] border border-zinc-800/80 hover:border-[#00c48c]/50 shadow-xl transition-all duration-300 relative group overflow-hidden">
                <div className="absolute top-0 inset-x-1/4 h-[1px] bg-gradient-to-r from-transparent via-[#00c48c]/50 to-transparent pointer-events-none" />
                
                <div className="w-14 h-14 rounded-2xl bg-[#181B29] border border-zinc-800 flex items-center justify-center text-[#00c48c] mb-2 shadow-sm">
                  <Cpu size={28} />
                </div>
                
                <h3 className="text-white font-bold text-base mb-1">
                  أضف جهاز للأداة
                </h3>
                <span className="text-[11px] text-zinc-400 mb-4">
                  ربط جهاز إضافي لأداتك الفعالة
                </span>

                {/* Counter */}
                <div className="flex items-center justify-between gap-3 w-full mb-5">
                  <button 
                    onClick={handleDecrement} 
                    className="p-2 rounded-xl bg-[#181B29] hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 transition-all disabled:opacity-40" 
                    disabled={number <= 1}
                  >
                    <CircleMinus size={22} />
                  </button>
                  <span className="flex-1 text-center py-2 rounded-xl bg-[#181B29] text-white font-mono font-bold text-xl border border-zinc-800">
                    {number}
                  </span>
                  <button 
                    onClick={handleIncrement} 
                    className="p-2 rounded-xl bg-[#181B29] hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 transition-all disabled:opacity-40" 
                    disabled={number >= 10}
                  >
                    <CirclePlus size={22} />
                  </button>
                </div>

                {/* Buy Button */}
                <button
                  onClick={() => {
                    if (data.userToolsData && data.toolsData) {
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
                  className="w-full py-2.5 px-4 rounded-xl bg-[#00c48c] hover:bg-[#00b07d] text-slate-950 font-bold text-xs sm:text-sm flex items-center justify-between shadow-md shadow-[#00c48c]/20 hover:scale-[1.02] active:scale-95 transition-all"
                >
                  <span>شراء الآن</span>
                  <span className="font-mono font-extrabold">
                    {data?.userToolsData && data?.toolsData ? (() => {
                      const activeTool = data.userToolsData.find((ut: any) => ut.isActive);
                      if (activeTool) {
                        const toolInfo = data.toolsData.find((t: any) => t.tool_id === activeTool.tool_id);
                        return toolInfo ? (toolInfo.additional_device_price * number)?.toLocaleString('en-US') : '—';
                      }
                      return '—';
                    })() : '—'} IQD
                  </span>
                </button>
              </div>

              {/* Light Mode Card */}
              <div className="dark:hidden flex flex-col items-center shadow-lg w-[250px] bg-[linear-gradient(135deg,_#4f008c,_#190237,_#190237)] rounded-xl px-5 py-3 gradient-border-Qs gap-3">
                <UsersRound className="text-orange w-[80%] h-[80%]"/>
                <div className='text-white font-bold text-xl mb-3'>أضف جهاز للأداة</div>
                <div className="flex items-center justify-between gap-5 w-full mb-3">
                  <button onClick={handleDecrement} className="px-2 py-2 text-orange font-bold cursor-pointer" disabled={number <= 0}>
                    <CircleMinus size={30}/>
                  </button>
                  <p className="text-orange bg-[#35214f] inner-shadow rounded-xl px-5 py-2 font-bold text-2xl">{number}</p>
                  <button onClick={handleIncrement} className="px-2 py-2 text-orange font-bold cursor-pointer" disabled={number >= 10}>
                    <CirclePlus size={30}/>
                  </button>
                </div>
                <div className="flex items-center justify-center w-[80%] bg-[linear-gradient(135deg,_#4f008c,_#190237,_#190237)] skew-x-[-50deg] rounded-[15px] gradient-border-packet text-white">
                  <button 
                    onClick={() => {
                      if (data.userToolsData && data.toolsData) {
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
                    Buy <span className="text-[#00c48c] font-bold text-lg">{data?.userToolsData && data?.toolsData ? (() => {
                      const activeTool = data.userToolsData.find((ut: any) => ut.isActive);
                      if (activeTool) {
                        const toolInfo = data.toolsData.find((t: any) => t.tool_id === activeTool.tool_id);
                        return toolInfo ? (toolInfo.additional_device_price * number)?.toLocaleString('en-US') : 'N/A';
                      }
                      return 'N/A';
                    })() : 'N/A'} IQD</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* ==================== CONNECTED DEVICES LIST ==================== */}
        {isDevicesLoading ? (
          <div className="flex justify-center items-center p-12 text-zinc-400">
            <p>جاري تحميل الأجهزة...</p>
          </div>
        ) : devicesError ? (
          <div className="p-6 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-center my-4 max-w-xl mx-auto">
            <p className="font-bold mb-2">حدث خطأ أثناء تحميل الأجهزة</p>
            <button 
              onClick={() => window.location.reload()} 
              className="mt-2 bg-[#00c48c] text-slate-950 font-bold px-4 py-2 rounded-xl text-xs"
            >
              إعادة المحاولة
            </button>
          </div>
        ) : (
          <div className="flex items-center flex-wrap justify-center gap-6 my-8">
            {devices?.map((device) => {
              if (device.isMainDevice === true) return null;
              if (new Date(device.endedAt) < new Date()) return null;
              
              const hasActivePack = data?.userPacksData?.some((p) => p.isActive === true);
              const hasActiveTool = data?.userToolsData?.some((t) => t.isActive === true);
              if (!hasActivePack && !hasActiveTool) return null;

              const isOnline = active_sessions?.some((session) => session.device_token === device.device_token);

              return (
                <React.Fragment key={device.device_id}>
                  {/* Dark Mode Device Bento Card */}
                  <div className="hidden dark:flex flex-col items-center w-[270px] p-5 rounded-2xl bg-[#12141F] border border-zinc-800/80 hover:border-[#00c48c]/40 shadow-xl transition-all duration-300 relative group overflow-hidden gap-3">
                    <div className="absolute top-0 inset-x-1/4 h-[1px] bg-gradient-to-r from-transparent via-[#00c48c]/40 to-transparent pointer-events-none" />
                    
                    {/* Device Icon / Active State */}
                    <div className="relative my-2">
                      <img 
                        src={isOnline ? "/images/device-g.png" : "/images/device-o.png"} 
                        alt="device" 
                        className="w-24 h-auto object-contain" 
                      />
                      <span className={`absolute bottom-0 end-0 w-3 h-3 rounded-full border-2 border-[#12141F] ${isOnline ? 'bg-emerald-400' : 'bg-zinc-500'}`} />
                    </div>

                    {/* Device Name & Type */}
                    <div className="flex flex-col items-center text-center w-full">
                      <h4 className="text-white font-bold text-base leading-tight">{device.device_name}</h4>
                      {device.pack && (
                        <span className="text-[11px] text-amber-400 font-medium mt-1">باقة: {device.pack.pack_name}</span>
                      )}
                      {device.tool && (
                        <span className="text-[11px] text-[#00c48c] font-medium mt-1">أداة: {device.tool.tool_name}</span>
                      )}
                    </div>

                    {/* Expiration Date */}
                    <div className="flex items-center gap-2 w-full p-2.5 rounded-xl bg-[#181B29] border border-zinc-800/60 text-xs">
                      <Clock size={16} className="text-zinc-400 shrink-0" />
                      <div className="flex flex-col text-right truncate">
                        <span className="text-[10px] text-zinc-400">{t('devices.expiredAt')}:</span>
                        <span className="text-zinc-200 font-mono text-[11px] truncate">{fullDateTimeFormat(device.endedAt) || '—'}</span>
                      </div>
                    </div>
                    
                    {/* Device Token Copy Box */}
                    <div 
                      onClick={() => {
                        if (device.device_token) {
                          navigator.clipboard.writeText(device.device_token);
                          setCopiedToken(device.device_token);
                          setTimeout(() => setCopiedToken(null), 2000);
                        }
                      }}
                      className="w-full cursor-pointer group/token"
                    >
                      <div className="w-full py-2 px-3 rounded-xl bg-[#181B29] hover:bg-[#202436] border border-zinc-800/80 transition-all flex items-center justify-between text-xs text-zinc-300">
                        {copiedToken === device.device_token ? (
                          <div className="flex items-center gap-1.5 text-[#00c48c] w-full justify-center font-bold">
                            <Check size={14} />
                            <span>تم النسخ!</span>
                          </div>
                        ) : (
                          <>
                            <span className="font-mono text-[11px] truncate">{device.device_token || ''}</span>
                            <Copy size={14} className="text-zinc-400 group-hover/token:text-white shrink-0 ms-1" />
                          </>
                        )}
                      </div>
                    </div>

                    {/* Logout Button */}
                    <button 
                      onClick={() => handleLogoutDevice(device.device_token)}
                      className="w-full mt-1 py-2.5 px-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/25 text-xs font-bold flex items-center justify-center gap-2 transition-all active:scale-95"
                    >
                      <span>{isOnline ? t('devices.logout') : t('devices.loggedOut')}</span>
                      <LogOut size={14} />
                    </button>
                  </div>

                  {/* Light Mode Original Card */}
                  <div className="dark:hidden flex flex-col items-center shadow-lg w-[250px] bg-[linear-gradient(135deg,_#4f008c,_#190237,_#190237)] rounded-xl px-4 gradient-border-Qs gap-3">
                    <img src={isOnline ? "/images/device-g.png" : "/images/device-o.png"} alt="device" className="w-35" />
                    <div className="flex flex-col items-center w-full mb-2">
                      <p className="text-white font-bold text-lg">{device.device_name}</p>
                      {device.pack && <p className="text-orange text-xs">Pack: {device.pack.pack_name}</p>}
                      {device.tool && <p className="text-green-400 text-xs">Tool: {device.tool.tool_name}</p>}
                    </div>

                    <div className="flex items-center justify-between mb-3 w-full">
                      <Clock size={30} className="text-orange "/>
                      <p className="text-white text-md flex flex-col items-start text-center bg-gradient-to-r from-purple-900 via-purple-900 to-[#190237] py-1 rounded-lg">
                        <span className='text-orange font-bold text-xs'>{t('devices.expiredAt')}:</span> {fullDateTimeFormat(device.endedAt) || ''}
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

                    <div className="flex items-center justify-center w-[80%] mb-3 bg-[linear-gradient(135deg,_#4f008c,_#190237,_#190237)] skew-x-[-50deg] rounded-[15px] gradient-border-packet text-white">
                      <button 
                        onClick={() => handleLogoutDevice(device.device_token)}
                        className="skew-x-[50deg] px-3 py-2 flex items-center gap-2 text-md font-bold"
                      >
                        {isOnline ? t('devices.logout') : t('devices.loggedOut')}
                        <LogOut className="text-orange" />
                      </button>
                    </div>
                  </div>
                </React.Fragment>
              );
            })}
          </div>
        )}

        {/* Device Information Section */}
        <div className="px-4">
          <DeviceInfo />
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