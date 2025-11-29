import Link from "next/link";
import { useEffect, useState } from "react"; // Added useEffect and useState
import DarkModeSwitcher from "./DarkModeSwitcher";
import DropdownMessage from "./DropdownMessage";
import DropdownUser from "./DropdownUser";
import Image from "next/image";
import { useMyInfo } from "@/utils/user-info/getUserInfo";
import nexusLogo from "@/public/images/nexus-logo.png"
import { Bell, ChevronDown, Globe, Menu, User, X } from "lucide-react";
import { useTranslation } from "react-i18next";

const Header = (props: {
  sidebarOpen: string | boolean | undefined;
  setSidebarOpen: (arg0: boolean) => void;
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { data } = useMyInfo();
  const [dynamicLogoUrl, setDynamicLogoUrl] = useState<string | null>(null);
  const staticLogoPath = "/images/nexus-logo-22.png"; // Define static path
  const [unreadCount, setUnreadCount] = useState(0);
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  const { t, i18n } = useTranslation();
  const [isLanguageDropdownOpen, setIsLanguageDropdownOpen] = useState(false);

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'ar' : 'en';
    i18n.changeLanguage(newLang);
  };


  useEffect(() => {
    const fetchLogo = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/settings/site_logo`);
        if (response.ok) {
          const result = await response.json();
          if (result.value) {
            setDynamicLogoUrl(`${process.env.NEXT_PUBLIC_API_URL}${result.value}`);
          }
        }
      } catch (error) {
        console.error("Failed to fetch site logo:", error);
      }
    };

    fetchLogo();
  }, []);
// ....................................................


const fetchUnreadCount = async () => {
  try {
    const userId = localStorage.getItem('a');
    if (!userId) return;

    const response = await fetch(`${API_URL}/api/notifications/unread-count/${userId}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('a')}`,
      },
    });

    if (response.ok) {
      const data = await response.json();
      setUnreadCount(data.count);
    }
  } catch (error) {
    console.error('Error fetching unread count:', error);
  }
};

useEffect(() => {
  fetchUnreadCount();

  // Connect to WebSocket
  const ws = new WebSocket("wss://api.nexustoolz.com"); // Convert HTTP URL to WS URL

  ws.onopen = () => {
    
    // Send user data after connection
    const userId = localStorage.getItem('a');
    if (userId) {
      ws.send(JSON.stringify([{ userData: { id: userId } }]));
    }
  };

  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      if (data.type === 'NOTIFICATION_UPDATE') {
        const userId = localStorage.getItem('a');
        // Update count if it's a broadcast notification or meant for this user
        if (!data.data.userId || data.data.userId === userId) {
          setUnreadCount(data.data.count);
        }
      }
    } catch (error) {
      console.error('Error processing WebSocket message:', error);
    }
  };

  ws.onerror = (error) => {
    console.error('WebSocket error:', error);
  };

  return () => {
    ws.close();
  };
}, []);

  const displayLogoUrl = dynamicLogoUrl || staticLogoPath;

  return (
    <div className="sticky  top-0 z-[9999] w-full inner-shadow-header bg-[linear-gradient(135deg,_#190237,_#190237,_#4f008c)]">
      <div className="bg-[#ffffff00] flex items-center justify-between px-2 sm:px-4 md:px-10 py-2 w-full">
        {/* Mobile menu button */}
        <div className="md:hidden flex items-center gap-4">

       
        <button 
          className="md:hidden text-white p-2"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X size={30} /> : <Menu strokeWidth={3} className="text-[#00c48c]" size={30} />}
        </button>
        <Link href="/notifications" className="relative md:hidden" onClick={() => setIsMobileMenuOpen(false)}>
                        <Bell color="#00c48c" size={24}/>
                        {unreadCount > 0 && (
                          <div className="absolute -top-2 -right-1 bg-orange text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                            {unreadCount > 99 ? '99+' : unreadCount}
                          </div>
                        )}
                      </Link>
        </div>
        {/* Desktop user info and controls */}
        <div className="hidden md:flex items-center gap-2 lg:gap-4">
          <Link
            href="/profile"
            className="flex items-center gap-1 lg:gap-2 rounded-xl border border-transparent px-2 py-1 transition hover:border-white/20 hover:bg-white/5"
            aria-label="Open profile page"
          >
            <User className="" size={40} color={"#00c48c"}/>
            <div className="flex flex-col items-center gap-1 text-center">
              <p className="text-xs md:text-lg font-bold flex justify-center items-center w-full text-white">
                {data?.userData?.firstName + " " + data?.userData?.lastName}
              </p>
              {/* <div className="flex items-center gap-1 px-2 bg-[#00c48c] rounded-xl text-black font-bold border-2 border-[#ff7702]">
                {data?.userToolsData?.length === 0 && data?.userPlansData?.length === 0 && data?.userPacksData?.length === 0 ? (
                  <p className="text-xs md:text-lg text-center w-full dark:text-white">
                    {t('dashboard.subscribeNow')}
                  </p>
                ) : (
                  <p className="text-[9px] lg:text-lg">{t('dashboard.youHaveAPlan')}</p>
                )}
              </div> */}
            </div>
          </Link>

          <div className="relative">
            <div 
              className="hidden md:flex text-xs inner-shadow lg:text-base items-center px-1 sm:px-2 py-0 sm:py-1 gap-1 text-sm bg-[#00c48c] rounded-full text-black font-bold cursor-pointer"
              onClick={() => setIsLanguageDropdownOpen(!isLanguageDropdownOpen)}
            >
              <Globe className="w-3 lg:w-6"/>
              {i18n.language.toUpperCase()}
              <ChevronDown className="w-3 lg:w-6"/>
            </div>
            
            {isLanguageDropdownOpen && (
              <div className="absolute top-full left-0 mt-1 bg-orange rounded-lg shadow-lg py-1 z-50">
                <div 
                  className="px-4 py-1 hover:bg-orange/80 cursor-pointer text-white text-xs lg:text-sm"
                  onClick={() => {
                    toggleLanguage();
                    setIsLanguageDropdownOpen(false);
                  }}
                >
                  {i18n.language === 'en' ? 'العربية' : 'English'}
                </div>
              </div>
            )}
          </div>

          <div className="relative">
            <Link href="/notifications">
              <div className="relative">
                <Bell color="#00c48c" className="w-5 lg:w-8"/>
                {unreadCount > 0 && (
                  <div className="absolute -top-2 -right-1 bg-orange text-white rounded-full w-4 h-4 lg:w-5 lg:h-5 flex items-center justify-center text-xs lg:text-sm">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </div>
                )}
              </div>
            </Link>
          </div>
        </div>
        
        {/* Logo - centered on mobile */}
        <Link href="/dashboard" className="md:ml-0">

<img 
            className="object-contain h-12 w-32 lg:h-20 lg:w-40 mx-auto md:mx-0" 
            src={"/images/logoN.png"} 
            alt="Site Logo" 
          />
{/* {displayLogoUrl?<img 
            className="object-contain h-12 w-32 lg:h-20 lg:w-40 mx-auto md:mx-0" 
            src={displayLogoUrl} 
            alt="Site Logo" 
          />:<img 
            className="object-contain h-12 w-32 lg:h-20 lg:w-40 mx-auto md:mx-0" 
            src={"/images/logoN.png"} 
            alt="Site Logo" 
          />} */}
        </Link> 
        
        {/* Upgrade button - hidden on mobile */}
        <div className="hidden md:block">
          <Link href={"/plans"}>
            <div className="inner-shadow items-center text-xs lg:text-2xl gap-1 lg:gap-2 px-3 py-1 bg-[#00c48c] rounded-xl text-white font-bold border-2 border-[#ff7702] flex">
              <img className="w-7 lg:w-13 animate-pulse" src="/images/crown.png" alt="" />
              {t('dashboard.upgrade')}
            </div>
          </Link>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
          <div className="fixed inset-0 z-50 md:hidden">
            {/* Overlay */}
            <div 
              className="fixed inset-0 bg-black/50"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            
            {/* Menu Panel */}
            <div className="fixed inset-y-0 right-0 w-4/5 max-w-sm bg-[#190237] shadow-lg p-6 overflow-y-auto">
              <div className="flex flex-col space-y-6">
                {/* User Info */}
                <Link
                  href="/profile"
                  className="flex items-center gap-3 border-b border-gray-700 pb-4"
                  onClick={() => setIsMobileMenuOpen(false)}
                  aria-label="Open profile page"
                >
                  <User size={40} color="#00c48c"/>
                  <div className="flex-1">
                    <p className="text-white text-lg">
                      {data?.userData?.firstName + " " + data?.userData?.lastName}
                    </p>
                    <div className="flex items-center justify-between mt-1">
                      <div className="px-2 bg-[#00c48c] rounded-full text-black text-xs font-bold border border-[#ff7702]">
                        {data?.userToolsData?.length === 0 && data?.userPlansData?.length === 0 && data?.userPacksData?.length === 0 
                          ? t('dashboard.subscribeNow')
                          : t('dashboard.youHaveAPlan')
                        }
                      </div>
                     
                    </div>
                  </div>
                </Link>
                
                {/* Language Selector */}
                <div className="border-b border-gray-700 pb-4">
                  <div 
                    className="flex items-center justify-between text-white py-2 cursor-pointer"
                    onClick={() => {
                      toggleLanguage();
                      // setIsMobileMenuOpen(false);
                    }}
                  >
                    <span>{i18n.language === 'en' ? 'العربية' : 'English'}</span>
                    <Globe className="text-[#00c48c]" />
                  </div>
                </div>
                
                {/* Upgrade Button */}
                <Link 
                  href="/plans" 
                  className="flex items-center justify-center gap-2 bg-[#00c48c] text-white py-2 px-4 rounded-xl font-bold border-2 border-[#ff7702]"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <img className="w-6 h-6" src="/images/crown.png" alt="" />
                  {t('dashboard.upgrade')}
                </Link>
                
              </div>
            </div>
          </div>
        )}
      </div>
  );
};

export default Header;
