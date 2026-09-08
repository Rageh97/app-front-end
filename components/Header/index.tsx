import Link from "next/link";
import { useEffect, useState, useMemo } from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";
import DropdownMessage from "./DropdownMessage";
import DropdownUser from "./DropdownUser";
import Image from "next/image";
import { useMyInfo } from "@/utils/user-info/getUserInfo";
import nexusLogo from "@/public/images/nexus-logo.png"
import { Bell, Globe, Menu, User, X, House, Crown, ShoppingBag, ShoppingCart, Vibrate, ShieldCheck, ShieldUser, LogOut, Sparkles, TypeOutline, Video } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useGetDevices } from "@/hooks/useGetDevices";
import axios from "axios";

const Header = (props: {
  sidebarOpen: string | boolean | undefined;
  setSidebarOpen: (arg0: boolean) => void;
}) => {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { data } = useMyInfo();
  const [dynamicLogoUrl, setDynamicLogoUrl] = useState<string | null>(null);
  const staticLogoPath = "/images/nexus-logo-22.png"; // Define static path
  const [unreadCount, setUnreadCount] = useState(0);
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  const { t } = useTranslation();
  const { devices, active_sessions } = useGetDevices();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);


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
      const token = localStorage.getItem('a');
      if (!token) {
        setUnreadCount(0);
        return;
      }

      const response = await fetch(`${API_URL}/api/notifications/unread-count`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const result = await response.json();
        setUnreadCount(result.count || 0);
      }
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  useEffect(() => {
    fetchUnreadCount();

    const handleCustomUpdate = () => {
      fetchUnreadCount();
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('notificationUpdated', handleCustomUpdate);
    }

    // Dynamic WebSocket URL with fallback
    let wsUrl = "wss://api.nexustoolz.com";
    if (typeof window !== 'undefined') {
      if (API_URL && API_URL.startsWith('http')) {
        wsUrl = API_URL.replace(/^http/, 'ws');
      } else if (window.location.protocol === 'https:') {
        wsUrl = `wss://${window.location.host}`;
      } else {
        wsUrl = `ws://${window.location.host}`;
      }
    }

    let ws: WebSocket | null = null;
    try {
      ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        const myUserId = data?.userData?.userId;
        if (myUserId) {
          ws?.send(JSON.stringify([{ userData: { id: myUserId, email: data?.userData?.email } }]));
        }
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === 'NOTIFICATION_REFRESH' || msg.type === 'NOTIFICATION_UPDATE') {
            const myUserId = data?.userData?.userId;
            const targetId = msg.data?.userId;
            if (!targetId || targetId === myUserId) {
              fetchUnreadCount();
            }
          }
        } catch (err) {
          console.error('Error processing WebSocket message:', err);
        }
      };

      ws.onerror = (err) => {
        console.warn('WebSocket connection warning:', err);
      };
    } catch (e) {
      console.warn('Could not initialize WebSocket:', e);
    }

    // Interval to refresh unread count periodically
    const interval = setInterval(fetchUnreadCount, 45000);

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('notificationUpdated', handleCustomUpdate);
      }
      clearInterval(interval);
      if (ws) {
        try { ws.close(); } catch (e) {}
      }
    };
  }, [data]);

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
      completeHref: "/dashboard/web-tools",
      name: "أدوات المواقع",
      icon: <Globe size={24} />,
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

  const hasActiveSubscription = useMemo(() => {
    if (!data) return false;
    const hasPacks = data?.userPacksData?.some((pack: any) => pack.isActive !== false) || (data?.userPacksData && data?.userPacksData.length > 0);
    const hasTools = data?.userToolsData?.some((tool: any) => tool.isActive !== false) || (data?.userToolsData && data?.userToolsData.length > 0);
    const hasPlans = data?.userPlansData?.some((plan: any) => plan.isActive !== false) || (data?.userPlansData && data?.userPlansData.length > 0);
    const hasCredits = Number(data?.userData?.credits || 0) > 0 || (data?.userCreditsData && data?.userCreditsData.length > 0);
    const hasAiPlan = Boolean(data?.hasAiPlan || data?.hasActivePlan);
    return Boolean(hasPacks || hasTools || hasPlans || hasCredits || hasAiPlan);
  }, [data]);

  return (
    <div className="sticky top-0 z-[9999] w-full shadow-lg backdrop-blur-md bg-[#190237]/80 dark:bg-[#08090E]/95 border-b border-white/5 dark:border-zinc-800/80 transition-all duration-300">
      <div className="flex items-center justify-between px-4 py-2.5 max-w-[1760px] mx-auto w-full h-full gap-2">
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

        {/* Logo - left side on desktop */}
        <Link href="/dashboard" className="flex items-center gap-2 transition-transform hover:scale-105 duration-300">
          <img 
            className="object-contain h-9 md:h-10 w-auto" 
            src={"/images/logoN.png"} 
            alt="Nexus Toolz" 
          />
        </Link> 

        {/* Horizontal Navigation Menu for Dark Mode - ONLY visible on Desktop (lg+) */}
        <div className="hidden lg:dark:flex items-center gap-1 xl:gap-2 px-4 py-1.5 bg-[#12141F]/90 border border-zinc-800/80 rounded-full shadow-md overflow-x-auto no-scrollbar">
          {menuItems.map((item) => 
            item.permission && item.completeHref !== "/profile" && item.completeHref !== "/logout" && (
              <Link
                key={item.completeHref}
                href={item.completeHref}
                className={`px-4 py-1.5 rounded-full text-xs xl:text-sm transition-all duration-300 flex items-center gap-1.5 whitespace-nowrap border relative group ${
                  pathname === item.completeHref
                    ? 'bg-gradient-to-b from-[#00c48c]/20 to-[#00c48c]/5 text-[#00c48c] border-[#00c48c]/30 shadow-[0_0_15px_rgba(0,196,140,0.15)] font-bold'
                    : 'text-zinc-400 border-transparent hover:text-white hover:bg-white/5 hover:border-white/10 hover:shadow-[0_0_10px_rgba(255,255,255,0.03)] font-medium active:scale-95'
                }`}
              >
                {/* Subtle top highlight for active link */}
                {pathname === item.completeHref && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-[1px] bg-gradient-to-r from-transparent via-[#00c48c] to-transparent opacity-70"></div>
                )}
                <span className="relative z-10 flex items-center gap-1.5">
                  {item.completeHref === "/subscriptions" && hasActiveSubscription ? (
                    <span className="relative inline-flex items-center gap-1 font-black animate-amber-shimmer">
                      <span>{item.name}</span>
                      <span className="relative flex h-1.5 w-1.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-amber-400"></span>
                      </span>
                    </span>
                  ) : item.completeHref === "/dashboard/web-tools" ? (
                    <span className="relative inline-flex items-center gap-1 font-black animate-green-shimmer">
                      <span>{item.name}</span>
                      <span className="relative flex h-1.5 w-1.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400"></span>
                      </span>
                    </span>
                  ) : (
                    item.name
                  )}
                </span>
              </Link>
            )
          )}
        </div>

        {/* Desktop user info, language, notifications, logout, upgrade and controls */}
        <div className="hidden md:flex items-center gap-2 lg:gap-3">
          <Link
            href="/profile"
            className="flex items-center justify-center p-2 rounded-full border border-transparent border-white/20 bg-white/5 dark:bg-[#12141F] dark:border-zinc-800 dark:hover:bg-zinc-800 text-[#00c48c] hover:scale-105 transition-transform"
            aria-label="Open profile page"
            title={data?.userData?.firstName + " " + data?.userData?.lastName}
          >
            <User size={20} className="text-[#00c48c]"/>
          </Link>



          <div className="relative group">
            <Link href="/notifications" className="flex items-center justify-center p-2 rounded-full bg-white/10 dark:bg-[#12141F] border border-white/10 dark:border-zinc-800 hover:bg-white/20 dark:hover:bg-zinc-800 transition-colors">
              <div className="relative">
                <Bell className="w-4 h-4 text-[#00c48c] group-hover:text-emerald-400 transition-colors"/>
                {unreadCount > 0 && (
                  <div className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full min-w-[16px] h-[16px] flex items-center justify-center text-[9px] font-bold shadow-sm border border-[#190237] dark:border-[#0A0C14]">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </div>
                )}
              </div>
            </Link>
          </div>

          <button
            type="button"
            onClick={() => {
              localStorage.removeItem("a");
              localStorage.removeItem("token");
              window.location.href = "/signin";
            }}
            className="flex items-center justify-center p-2 rounded-full bg-white/10 dark:bg-[#12141F] border border-white/10 dark:border-zinc-800 hover:bg-red-500/20 text-red-400 hover:text-red-300 transition-colors"
            title="تسجيل الخروج"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && mounted && createPortal(
          <div className="fixed inset-0 z-[10000]">
            {/* Overlay */}
            <div 
              className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            
            {/* Menu Panel */}
            <div className="absolute top-0 right-0 h-full w-[85%] max-w-[320px] bg-[#190237]/95 dark:bg-[#0A0C14]/98 backdrop-blur-2xl border-l border-white/10 dark:border-zinc-800 shadow-2xl p-6 overflow-y-auto transform transition-transform duration-300 ease-in-out">
              <div className="flex flex-col space-y-5">
                {/* Header Top Controls */}
                <div className="flex items-center justify-between border-b border-gray-700 dark:border-zinc-800 pb-4">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        localStorage.removeItem("a");
                        localStorage.removeItem("token");
                        window.location.href = "/signin";
                      }}
                      className="p-2.5 rounded-full bg-white/10 dark:bg-[#12141F] border border-white/10 dark:border-zinc-800 hover:bg-red-500/20 text-red-400 transition-colors"
                      title="تسجيل الخروج"
                    >
                      <LogOut className="w-4 h-4" />
                    </button>
                  </div>
                  <button 
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="p-2 text-white/70 hover:text-white transition-colors rounded-full hover:bg-white/10 dark:hover:bg-zinc-800"
                  >
                    <X size={24} />
                  </button>
                </div>

                {/* User Info */}
                <Link
                  href="/profile"
                  className="flex items-center gap-3 border-b border-gray-700 dark:border-zinc-800 pb-4"
                  onClick={() => setIsMobileMenuOpen(false)}
                  aria-label="Open profile page"
                >
                  <div className="p-2 rounded-full bg-white/5 dark:bg-zinc-800 border border-white/10 dark:border-zinc-700">
                    <User size={32} color="#00c48c"/>
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <p className="text-white font-bold text-base truncate">
                      {data?.userData?.firstName + " " + data?.userData?.lastName}
                    </p>
                    <div className="flex items-center justify-between mt-1">
                      <div className="px-2.5 py-0.5 bg-[#00c48c]/20 text-[#00c48c] rounded-full text-xs font-bold border border-[#00c48c]/30">
                        {data?.userToolsData?.length === 0 && data?.userPlansData?.length === 0 && data?.userPacksData?.length === 0 
                          ? t('dashboard.subscribeNow')
                          : t('dashboard.youHaveAPlan')
                        }
                      </div>
                    </div>
                  </div>
                </Link>
                

                
                {/* Upgrade Button */}
                <Link 
                  href="/plans" 
                  className="flex items-center justify-center gap-2 bg-[#00c48c] text-slate-950 py-2.5 px-4 rounded-full font-bold shadow-md hover:bg-emerald-400 transition-all"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <img className="w-5 h-5" src="/images/crown.png" alt="" />
                  {t('dashboard.upgrade')}
                </Link>
                
                {/* Sidebar Menu Items */}
                <div className="border-t border-gray-700 dark:border-zinc-800 pt-2">
                  <div className="flex flex-col space-y-1">
                    {menuItems.map((item) => 
                      item.permission && item.completeHref !== "/logout" && (
                        <Link
                          key={item.completeHref}
                          href={item.completeHref}
                          className={`flex items-center gap-3 text-white py-2.5 px-3 rounded-xl transition-colors ${
                            pathname === item.completeHref
                              ? 'bg-[#00c48c]/20 dark:bg-[#00c48c]/20 text-[#00c48c] font-bold border border-[#00c48c]/30'
                              : 'hover:bg-white/10 dark:hover:bg-zinc-800/80 text-zinc-300'
                          }`}
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          {typeof item.icon === 'string' ? (
                            <span className="text-[#00c48c] font-bold">{item.icon}</span>
                          ) : (
                            <div className="text-[#00c48c]">{item.icon}</div>
                          )}
                          <span className="text-sm flex items-center gap-2">
                            {item.completeHref === "/subscriptions" && hasActiveSubscription ? (
                              <span className="inline-flex items-center gap-1 font-black animate-amber-shimmer">
                                <span>{item.name}</span>
                                <span className="relative flex h-1.5 w-1.5">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-amber-400"></span>
                                </span>
                              </span>
                            ) : item.completeHref === "/dashboard/web-tools" ? (
                              <span className="inline-flex items-center gap-1 font-black animate-green-shimmer">
                                <span>{item.name}</span>
                                <span className="relative flex h-1.5 w-1.5">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400"></span>
                                </span>
                              </span>
                            ) : (
                              item.name
                            )}
                          </span>
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
