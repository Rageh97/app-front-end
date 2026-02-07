import Link from "next/link";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import DarkModeSwitcher from "./DarkModeSwitcher";
import DropdownMessage from "./DropdownMessage";
import DropdownUser from "./DropdownUser";
import Image from "next/image";
import { useMyInfo } from "@/utils/user-info/getUserInfo";
import nexusLogo from "@/public/images/nexus-logo.png"
import { Bell, ChevronDown, Globe, Menu, User, X, House, Crown, ShoppingBag, ShoppingCart, Vibrate, ShieldCheck, ShieldUser, LogOut, Sparkles, TypeOutline, Video } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useGetDevices } from "@/hooks/useGetDevices";
import axios from "axios";

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
  const { devices, active_sessions } = useGetDevices();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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
const [isMediaHubEnabled, setIsMediaHubEnabled] = useState(true);
  const [isFontsHubEnabled, setIsFontsHubEnabled] = useState(true);
  const [isAiHubEnabled, setIsAiHubEnabled] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const [mediaRes, fontsRes, aiRes] = await Promise.all([
          axios.get("/api/admin/settings/media_hub_enabled"),
          axios.get("/api/admin/settings/fonts_hub_enabled"),
          axios.get("/api/admin/settings/ai_hub_enabled")
        ]);
        
        setIsMediaHubEnabled(String(mediaRes.data.value) !== 'false');
        setIsFontsHubEnabled(String(fontsRes.data.value) !== 'false');
        setIsAiHubEnabled(String(aiRes.data.value) !== 'false');
      } catch (error) {
        console.error("Failed to fetch settings:", error);
      }
    };

    fetchSettings();

    // Listen for real-time updates from Admin Page
    const handleSettingsChange = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (customEvent.detail) {
        if (customEvent.detail.key === 'media_hub_enabled') {
          setIsMediaHubEnabled(customEvent.detail.value);
        } else if (customEvent.detail.key === 'fonts_hub_enabled') {
          setIsFontsHubEnabled(customEvent.detail.value);
        } else if (customEvent.detail.key === 'ai_hub_enabled') {
          setIsAiHubEnabled(customEvent.detail.value);
        }
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('settingsChanged', handleSettingsChange);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('settingsChanged', handleSettingsChange);
      }
    };
  }, []);

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

  // Simple check: if user logged in without device token, they are on main device
  const isMainDevice = () => {
    // Check if user data is loaded
    if (!data) {
      return false;
    }
    
    // Check sessionStorage - if marked as additional device, don't show devices page
    const isAdditionalDevice = sessionStorage.getItem('isAdditionalDevice') === 'true';
    
    // Return true if this is NOT an additional device
    return !isAdditionalDevice;
  };

  // Menu items for mobile menu (same as sidebar)
  const menuItems = [
    {
      completeHref: "/dashboard",
      name: t('dashboard.Dashboard'),
      icon: <House size={24} />,
      permission: true,
    },
    {
      completeHref: "/ai",
      name: "Nexus Ai",
      icon: "Ai",
      permission: isAiHubEnabled || data?.userRole === "admin" || data?.userRole === "manager",
    },
     {
                completeHref: "/media-hub",
                name: "مكتبة الميديا",
                icon: <Video size={24} />,
                children: "",
                permission: isMediaHubEnabled || data?.userRole === "admin" || data?.userRole === "manager",
              },
                {
                  completeHref: "/fonts",
                  name: "مكتبة الخطوط ",
                  icon: <TypeOutline   size={24} />,
                  children: "",
                  permission: isFontsHubEnabled || data?.userRole === "admin" || data?.userRole === "manager",
                },
    {
      completeHref: "/subscriptions",
      name: t('dashboard.Subscriptions'),
      icon: <Crown size={24} />,
      permission: true,
    },
    {
      completeHref: "/plans",
      name: t('dashboard.Plans'),
      icon: <ShoppingBag size={24} />,
      permission: true,
    },
    {
      completeHref: "/orders",
      name: t('dashboard.Orders'),
      icon: <ShoppingCart size={24} />,
      permission: true,
    },
    {
      completeHref: "/devices",
      name: t('dashboard.Devices'),
      icon: <Vibrate size={24} />,
      permission: isMainDevice(),
    },
    {
      completeHref: "/Policy",
      name: t('footer.returnPolicy'),
      icon: <ShieldCheck size={24} />,
      permission: true,
    },
    {
      completeHref: "/admin",
      name: data?.userRole === "admin" ? t('dashboard.Admin') : t('admin.manage'),
      icon: <ShieldUser size={24} />,
      permission: data?.userRole === "admin" || data?.userRole === "manager" || data?.userRole === "supervisor" || data?.userRole === "employee" ? true : false,
    },
    {
      completeHref: "/profile",
      name: "الملف الشخصي",
      icon: <User size={24} />,
      permission: true,
    },
    {
      completeHref: "/logout",
      name: t('dashboard.Logout'),
      icon: <LogOut size={24} />,
      permission: true,
    },
  ];

  return (
    <div className="sticky top-0  z-[9999] w-full shadow-lg backdrop-blur-md bg-[#190237]/80 border-b border-white/5 transition-all duration-300">
      <div className="flex items-center justify-between px-4 py-2 max-w-[1760px] mx-auto w-full h-full">
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
            className="flex items-center gap-1 lg:gap-2 rounded-xl border border-transparent px-2 py-1 transition border-white/20 bg-white/5"
            aria-label="Open profile page"
          >
            <User className="" size={24} color={"#00c48c"}/>
            <div className="flex flex-col items-center gap-0.5 text-center">
              <p className="text-sm md:text-base font-bold text-white px-2">
                {data?.userData?.firstName + " " + data?.userData?.lastName}
              </p>
            </div>
          </Link>

          <div className="relative">
            <div 
              className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/10 rounded-full text-white text-sm font-medium transition-all duration-300 cursor-pointer group"
              onClick={() => setIsLanguageDropdownOpen(!isLanguageDropdownOpen)}
            >
              <Globe className="w-4 h-4 text-[#00c48c] group-hover:rotate-12 transition-transform"/>
              <span className="pt-0.5">{i18n.language.toUpperCase()}</span>
              <ChevronDown className={`w-3 h-3 transition-transform duration-300 ${isLanguageDropdownOpen ? 'rotate-180' : ''}`}/>
            </div>
            
            {isLanguageDropdownOpen && (
              <div className="absolute top-full left-0 mt-2 w-32 bg-[#190237] border border-white/10 rounded-xl shadow-xl overflow-hidden backdrop-blur-xl z-50 animate-in fade-in slide-in-from-top-2">
                <div 
                  className="px-4 py-2 hover:bg-white/10 cursor-pointer text-white text-sm transition-colors text-center"
                  onClick={() => {
                    toggleLanguage();
                    setIsLanguageDropdownOpen(false);
                  }}
                >
                  {i18n.language === 'en' ? 'Arabic (العربية)' : 'English (EN)'}
                </div>
              </div>
            )}
          </div>

          <div className="relative group">
            <Link href="/notifications" className="block p-1.5 rounded-full hover:bg-white/10 transition-colors">
              <div className="relative">
                <Bell className="w-6 h-6 text-[#00c48c] group-hover:text-emerald-400 transition-colors"/>
                {unreadCount > 0 && (
                  <div className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full min-w-[18px] h-[18px] flex items-center justify-center text-[10px] font-bold shadow-sm border border-[#190237]">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </div>
                )}
              </div>
            </Link>
          </div>
        </div>
        
        {/* Logo - centered on mobile */}
        <Link href="/dashboard" className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 md:static md:translate-x-0 md:translate-y-0 lg:ml-25 transition-transform hover:scale-105 duration-300 ">
          <img 
            className="object-contain h-10 md:h-10 w-auto" 
            src={"/images/logoN.png"} 
            alt="Nexus Toolz" 
          />
        </Link> 
        
        {/* Upgrade button - hidden on mobile */}
        {/* Upgrade button - hidden on mobile */}
        <div className="hidden md:block ml-12">
          <Link href={"/plans"}>
            <div className="group relative flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-[#00c48c] to-[#009b6e] hover:from-[#009b6e] hover:to-[#00c48c] rounded-xl text-white font-bold shadow-[0_4px_15px_rgba(0,196,140,0.3)] hover:shadow-[0_6px_20px_rgba(0,196,140,0.5)] transition-all duration-300 transform hover:-translate-y-0.5 border border-white/10 overflow-hidden">
             <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 rounded-xl"></div>
              <img className="w-5 h-5 animate-pulse relative z-10" src="/images/crown.png" alt="Premium" />
              <span className="text-xs md:text-base relative z-10">{t('dashboard.upgrade')}</span>
            </div>
          </Link>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && mounted && createPortal(
          <div className="fixed inset-0 z-[10000]">
            {/* Overlay */}
            <div 
              className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            
            {/* Menu Panel */}
            <div className="absolute top-0 right-0 h-full w-[85%] max-w-[300px] bg-[#190237]/95 backdrop-blur-xl border-l border-white/10 shadow-2xl p-6 overflow-y-auto transform transition-transform duration-300 ease-in-out">
              <div className="flex flex-col space-y-6">
                {/* Close Button */}
                <button 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="self-end p-2 text-white/70 hover:text-white transition-colors"
                >
                  <X size={24} />
                </button>
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
                
                {/* Sidebar Menu Items */}
                <div className="border-t border-gray-700 pt-4">
                  <div className="flex flex-col space-y-2">
                    {menuItems.map((item) => 
                      item.permission && (
                        <Link
                          key={item.completeHref}
                          href={item.completeHref}
                          className="flex items-center gap-3 text-white py-2 px-3 rounded-lg hover:bg-[#00c48c]/20 transition-colors"
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          {typeof item.icon === 'string' ? (
                            <span className="text-[#00c48c] font-bold">{item.icon}</span>
                          ) : (
                            <div className="text-[#00c48c]">{item.icon}</div>
                          )}
                          <span className="text-base">{item.name}</span>
                        </Link>
                      )
                    )}
                  </div>
                </div>
                
              </div>
            </div>
          </div>,
          document.body
        )}
      </div>
  );
};

export default Header;
