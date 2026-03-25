"use client";

import React, {
  FunctionComponent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useParams, usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import InvoiceIcon from "@/components/icons/InvoiceIcon";
import GroupIcon from "@/components/icons/GroupIcon";
import IndividualIcons from "@/components/icons/IndividualIcons";
import image_1 from "@/public/images/icon/1.png";
import image_6 from "@/public/images/icon/6.png";
import image_7 from "@/public/images/icon/7.png";
import image_4 from "@/public/images/icon/4.png";
import image_2 from "@/public/images/icon/2.png";
import image_3 from "@/public/images/icon/3.png";
import CalendarIcon from "@/components/icons/CalendarIcon";
import clsx from "clsx";
import BuildingIcon from "@/components/icons/BuildingIcon";
import { useMyInfo } from "@/utils/user-info/getUserInfo";
import { cn } from "@/utils/cn";
import ChevronDown from "@/components/icons/ChevronDown";
import * as consts from "@/consts";
import SignOutIcon from "../svg/SignOutIcon";
import AffiliateIcon from "../svg/AffiliateIcon";
import RocketIcon from "../svg/RocketIcon";
import { Crown, Download, House, ListOrdered, LogOut, ShieldCheck, ShieldUser, ShoppingBag, ShoppingCart, UsersRound, Vibrate, Video, Bell, User, MessageCircleMore, ImageDown, TypeOutline, Brain } from "lucide-react";
import axios from "@/utils/api";
import { useGetDevices } from "@/hooks/useGetDevices";
import { useTranslation } from 'react-i18next';

interface SidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (arg: boolean) => void;
}

const Sidebar = ({ sidebarOpen, setSidebarOpen }: SidebarProps) => {
  const pathname = usePathname();
  const trigger = useRef<any>(null);
  const sidebar = useRef<any>(null);

  let storedSidebarExpanded = "true";

  const [sidebarExpanded, setSidebarExpanded] = useState(
    storedSidebarExpanded === null ? false : storedSidebarExpanded === "true"
  );

  // close on click outside
  useEffect(() => {
    const clickHandler = ({ target }: MouseEvent) => {
      if (!sidebar.current || !trigger.current) return;
      if (
        !sidebarOpen ||
        sidebar.current.contains(target) ||
        trigger.current.contains(target)
      )
        return;
      setSidebarOpen(false);
    };
    document.addEventListener("click", clickHandler);
    return () => document.removeEventListener("click", clickHandler);
  });

  // close if the esc key is pressed
  useEffect(() => {
    const keyHandler = ({ keyCode }: KeyboardEvent) => {
      if (!sidebarOpen || keyCode !== 27) return;
      setSidebarOpen(false);
    };
    document.addEventListener("keydown", keyHandler);
    return () => document.removeEventListener("keydown", keyHandler);
  });

  useEffect(() => {
    localStorage.setItem("sidebar-expanded", sidebarExpanded.toString());
    if (sidebarExpanded) {
      document.querySelector("body")?.classList.add("sidebar-expanded");
    } else {
      document.querySelector("body")?.classList.remove("sidebar-expanded");
    }
  }, [sidebarExpanded]);

  const SidebarContent = useMemo(() => {
    if (
      pathname.startsWith("/clients/") &&
      !pathname.startsWith("/clients/new")
    ) {
      // return <ClientMenu />;
    } else if (
      pathname.startsWith("/employees/") &&
      !pathname.startsWith("/employees/new")
    ) {
      // return <EmployeeMenu />;
    } else {
      return <GlobalMenu />;
    }
  }, [pathname]);
  
  const { data } = useMyInfo();
  
  return (
    <aside
      ref={sidebar}
      className="fixed start-0 top-0 z-[999] hidden md:flex flex-col h-screen w-40 xl:w-44 duration-300 ease-linear 
      bg-gradient-to-b from-[#0f021b]/95 via-[#190237]/80 to-[#0f021b]/95 backdrop-blur-3xl border-e border-white/5 shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] 
      pt-30 pb-5 overflow-visible ring-1 ring-white/5"
    >
      {/* Shiny Glowing Border Effect */}
      <div className="absolute end-0 top-1/2 -translate-y-1/2 h-[70%] w-[1px] bg-gradient-to-b from-transparent via-[#ff7702] to-transparent opacity-80"></div>
      
      <div className="flex-1 w-full flex flex-col items-center gap-2 overflow-y-auto no-scrollbar">
         {SidebarContent}
      </div>
      
      {/* Optional: Need Help / Footer items moved here if needed */}
    </aside>
  );
};

export default Sidebar;

type SidebarDropdownProps = {
  name?: string;
  isDropdown: true;
  completeHref?: undefined;
  children: React.ReactNode;
  icon: React.ReactNode;
  getIsActive?: undefined;
  subItems: SidebarLinkProps[];
  permission?: Boolean;
};

type SidebarLinkProps =
  | {
    name?: string;
    isDropdown?: false;
    completeHref: string;
    children: React.ReactNode;
    icon: React.ReactNode;
    getIsActive?: (pathname: string, completeHref: string) => boolean;
    permission?: Boolean;
    badge?: string;
  }
  | SidebarDropdownProps;

const SidebarLink: FunctionComponent<SidebarLinkProps> = ({
  completeHref,
  children,
  icon,
  getIsActive,
  name,
  ...props
}) => {
  const pathname = usePathname();

  const isActive = getIsActive
    ? getIsActive(pathname, completeHref)
    : pathname.startsWith(completeHref);

  const badge = 'badge' in props ? props.badge : undefined;

  return (
    <Link
      href={completeHref}
      className={clsx(
        "group relative flex items-center justify-start w-full px-2 h-12 gap-2 rounded-xl transition-all duration-500 ease-out",
        {
          "bg-white/10 backdrop-blur-xl border border-white/20 text-emerald-500 inner-shadow shadow-[0_0_20px_rgba(255,255,255,0.3),inset_0_0_10px_rgba(255,255,255,0.05)] scale-[1.02]": isActive,
          "text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 hover:shadow-[0_0_15px_rgba(255,255,255,0.15)] hover:scale-[1.02] border border-transparent hover:border-white/10": !isActive,
        }
      )}
    >
      <span className="relative z-10 transition-transform duration-300 group-hover:scale-110 flex-shrink-0">
        {icon}
      </span>
      <div className="flex items-center gap-2 overflow-hidden w-full">
        <span className="relative z-10 font-medium whitespace-nowrap text-sm truncate">
          {name}
        </span>
        {badge && (
          <span className="relative z-10 flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span>
          </span>
        )}
      </div>
      
      {/* Animated glow on hover for non-active items */}
      {!isActive && (
        <div className="absolute inset-0 rounded-2xl bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform scale-95 group-hover:scale-100" />
      )}
    </Link>
  );
};

type SidebarMenuProps = {
  items: SidebarLinkProps[];
  title: string | React.ReactNode;
};

const SidebarMenu: FunctionComponent<SidebarMenuProps> = ({ items, title }) => {
  return (
    <div className="w-full flex py-5 flex-col gap-3 px-2 xl:px-3">
      <ul className="flex flex-col gap-2 w-full text-base">
        {items.map(
          (item) =>
            item.permission && (
              <li
                className="relative group w-full flex"
                key={item.completeHref}
              >
                <SidebarLink {...item} name={item.name}>{item.children}</SidebarLink>
              </li>
            )
        )}
      </ul>
    </div>
  );
};

const GlobalMenu: FunctionComponent = () => {
  const { data } = useMyInfo();
  const { t } = useTranslation();
  
  const { devices, active_sessions } = useGetDevices();

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
 
  // Simple check: if user logged in without device token, they are on main device
  const isMainDevice = () => {
    if (!data) {
      return false;
    }
    const isAdditionalDevice = sessionStorage.getItem('isAdditionalDevice') === 'true';
    return !isAdditionalDevice;
  };

  const hasActiveSubscription = () => {
    if (!data) return false;
    const hasActivePacks = data.userPacksData?.some((pack: any) => pack.isActive === true);
    const hasActiveTools = data.userToolsData?.some((tool: any) => tool.isActive === true);
    return hasActivePacks || hasActiveTools;
  };

  if (data)
    return (
      <SidebarMenu
        items={[
          {
            completeHref: "/dashboard",
            name: t('dashboard.Dashboard'),
            icon: <House size={24} /> ,
            children: "",
            permission: true,
          },
          {
            completeHref: "/ai",
            name: "Nexus Ai",
            icon: <Brain size={24} />,
            badge: "NEW",
            children: "",
            permission: isAiHubEnabled || data?.userRole === "admin" || data?.userRole === "manager",
          },
            {
            completeHref: "/media-hub",
            name: t('dashboard.media'),
            icon: <Video size={24} />,
            children: "",
            permission: isMediaHubEnabled || data?.userRole === "admin" || data?.userRole === "manager",
          },
            {
              completeHref: "/fonts",
              name: t('dashboard.fontsLibrary'),
              icon: <TypeOutline   size={24} />,
              children: "",
              permission: isFontsHubEnabled || data?.userRole === "admin" || data?.userRole === "manager",
            },
          {
            completeHref: "/subscriptions",
            name: t('dashboard.Subscriptions'),
            icon: <Crown size={24} /> ,
            children: "",
            permission: true,
          },
          {
            completeHref: "/plans",
            name: t('dashboard.Plans'),
            icon: <ShoppingBag size={24} />,
            children: "",
            permission: true,
          },
         
          {
            completeHref: "/orders",
            name: t('dashboard.Orders'),
            icon: <ShoppingCart size={24} />,
            children: "",
            permission: true,
          },
          {
            completeHref: "/devices",
            name: t('dashboard.Devices'),
            icon: <Vibrate size={24} />,
            children: "",
            permission: isMainDevice()
          },
          {
            completeHref: "/Policy",
            name: t('footer.returnPolicy'),
            icon: <ShieldCheck size={24} />,
            children: "",
            permission: true,
          },
          
          {
            completeHref: "/admin",
            name: data?.userRole === "admin" ? t('dashboard.Admin') : t('admin.manage'),
            icon: <ShieldUser size={24} />,
            children: "",
            permission: data?.userRole === "admin" || data?.userRole === "manager" || data?.userRole === "supervisor" || data?.userRole === "employee" ? true : false,
          },
          {
            completeHref: "/profile",
            name: t('dashboard.profileUser'),
            icon: <User size={24} />,
            children: "",
            permission: true,
          },
          {
            completeHref: "/logout",
            name: t('dashboard.Logout'),
            icon: <LogOut  size={24}/>,
            children: "",
            permission: true,
          },
        ]}
        title={""}
        />
    );
  
  return null;
};
