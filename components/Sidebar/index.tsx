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
import { Crown, Download, House, ListOrdered, LogOut, ShieldCheck, ShieldUser, ShoppingBag, ShoppingCart, UsersRound, Vibrate, Video, Bell, User, MessageCircleMore, ImageDown } from "lucide-react";
import axios from "axios";
import { useGetDevices } from "@/hooks/useGetDevices";

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

  const Sidebar = useMemo(() => {
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
    
// className="fixed left-0 mt-60 z-[999] flex justify-center  h-auto flex-col overflow-y-hidden duration-300 ease-linear "
    <aside
      ref={sidebar}
      className="fixed z-[999] flex overflow-y-hidden duration-300 ease-linear
      bottom-0 left-0 w-full hidden md:flex flex-row items-center justify-center  
      md:top-0 md:bottom-auto md:mt-50 md:h-auto md:w-auto md:flex-col md:items-start md:justify-between"
      
    >
      
        {/* <div className="w-full p-3">
          <div className="w-full flex rounded-[10px] py-3 shadow-[inset_-4px_-4px_10px_0px_rgba(255,255,255,0.2)]">
            <div className="pl-2">
              <Image
                width={35}
                height={35}
                src={"/images/user-logo.png"}
                alt="Logo"
              />
            </div>
            <p className="text-sm flex justify-center items-center w-full">
              {data?.userData?.firstName + " " + data?.userData?.lastName}
            </p>
          </div>
        </div>
        <div className="h-[100px]">
        </div> */}
        {Sidebar}
        {/* <div className="flex gap-3">
          <a href="https://wa.me/9647702930873" target="_blank">
            <svg className="max-w-[22px] max-h-[22px]" xmlns="http://www.w3.org/2000/svg" viewBox="0,0,255.99828,255.99828" version="1.1" width="512" height="512" fill-rule="nonzero"><g fill="#ffffff" fill-rule="nonzero" stroke="none" stroke-width="1" stroke-linecap="butt" stroke-linejoin="miter" stroke-miterlimit="10" stroke-dasharray="" stroke-dashoffset="0" font-family="none" font-weight="none" font-size="none" text-anchor="none"><g transform="scale(5.12,5.12)"><path d="M25,3c-12.15,0 -22,9.85 -22,22c0,11.03 8.125,20.137 18.712,21.728v-15.897h-5.443v-5.783h5.443v-3.848c0,-6.371 3.104,-9.168 8.399,-9.168c2.536,0 3.877,0.188 4.512,0.274v5.048h-3.612c-2.248,0 -3.033,2.131 -3.033,4.533v3.161h6.588l-0.894,5.783h-5.694v15.944c10.738,-1.457 19.022,-10.638 19.022,-21.775c0,-12.15 -9.85,-22 -22,-22z"></path></g></g></svg>
          </a>
          <a href="https://wa.me/9647702930873" target="_blank">
            <svg className="max-w-[20px] max-h-[20px]" xmlns="http://www.w3.org/2000/svg" version="1.1" width="512" height="512" x="0" y="0" viewBox="0 0 24 24"><g><path d="m17.507 14.307-.009.075c-2.199-1.096-2.429-1.242-2.713-.816-.197.295-.771.964-.944 1.162-.175.195-.349.21-.646.075-.3-.15-1.263-.465-2.403-1.485-.888-.795-1.484-1.77-1.66-2.07-.293-.506.32-.578.878-1.634.1-.21.049-.375-.025-.524-.075-.15-.672-1.62-.922-2.206-.24-.584-.487-.51-.672-.51-.576-.05-.997-.042-1.368.344-1.614 1.774-1.207 3.604.174 5.55 2.714 3.552 4.16 4.206 6.804 5.114.714.227 1.365.195 1.88.121.574-.091 1.767-.721 2.016-1.426.255-.705.255-1.29.18-1.425-.074-.135-.27-.21-.57-.345z" fill="#ffffff" opacity="1" data-original="#000000"></path><path d="M20.52 3.449C12.831-3.984.106 1.407.101 11.893c0 2.096.549 4.14 1.595 5.945L0 24l6.335-1.652c7.905 4.27 17.661-1.4 17.665-10.449 0-3.176-1.24-6.165-3.495-8.411zm1.482 8.417c-.006 7.633-8.385 12.4-15.012 8.504l-.36-.214-3.75.975 1.005-3.645-.239-.375c-4.124-6.565.614-15.145 8.426-15.145a9.865 9.865 0 0 1 7.021 2.91 9.788 9.788 0 0 1 2.909 6.99z" fill="#ffffff" opacity="1" data-original="#000000"></path></g></svg>
          </a>
          <a href="https://wa.me/9647702930873" target="_blank">
            <svg className="max-w-[20px] max-h-[20px]" xmlns="http://www.w3.org/2000/svg" version="1.1" width="512" height="512" x="0" y="0" viewBox="0 0 409.592 409.592"><g><path d="M403.882 107.206c-2.15-17.935-19.052-35.133-36.736-37.437a1316.32 1316.32 0 0 0-324.685 0C24.762 72.068 7.86 89.271 5.71 107.206c-7.613 65.731-7.613 129.464 0 195.18 2.15 17.935 19.052 35.149 36.751 37.437a1316.32 1316.32 0 0 0 324.685 0c17.684-2.284 34.586-19.502 36.736-37.437 7.614-65.71 7.614-129.449 0-195.18zM170.661 273.074V136.539l102.4 68.27-102.4 68.265z" fill="#ffffff" opacity="1" data-original="#000000"></path></g></svg>
          </a>
          <a href="https://wa.me/9647702930873" target="_blank">
            <svg className="max-w-[20px] max-h-[20px]" xmlns="http://www.w3.org/2000/svg" version="1.1" width="512" height="512" x="0" y="0" viewBox="0 0 24 24"><g><path d="M12.004 5.838a6.157 6.157 0 0 0-6.158 6.158 6.157 6.157 0 0 0 6.158 6.158 6.157 6.157 0 0 0 6.158-6.158 6.157 6.157 0 0 0-6.158-6.158zm0 10.155a3.996 3.996 0 1 1 3.997-3.997 3.995 3.995 0 0 1-3.997 3.997z" fill="#ffffff" opacity="1" data-original="#000000"></path><path d="M16.948.076c-2.208-.103-7.677-.098-9.887 0-1.942.091-3.655.56-5.036 1.941C-.283 4.325.012 7.435.012 11.996c0 4.668-.26 7.706 2.013 9.979 2.317 2.316 5.472 2.013 9.979 2.013 4.624 0 6.22.003 7.855-.63 2.223-.863 3.901-2.85 4.065-6.419.104-2.209.098-7.677 0-9.887-.198-4.213-2.459-6.768-6.976-6.976zm3.495 20.372c-1.513 1.513-3.612 1.378-8.468 1.378-5 0-7.005.074-8.468-1.393-1.685-1.677-1.38-4.37-1.38-8.453 0-5.525-.567-9.504 4.978-9.788 1.274-.045 1.649-.06 4.856-.06l.045.03c5.329 0 9.51-.558 9.761 4.986.057 1.265.07 1.645.07 4.847-.001 4.942.093 6.959-1.394 8.453z" fill="#ffffff" opacity="1" data-original="#000000"></path><circle cx="18.406" cy="5.595" r="1.439" fill="#ffffff" opacity="1" data-original="#000000"></circle></g></svg>
          </a>
        </div>
        <div className="w-full p-3">
          <a href="https://wa.me/9647702930873" target="_blank" className="border-2 border-[#E1FE26] rounded-lg py-2 flex justify-center items-center text-white cursor-pointer hover:bg-[#E1FE26] hover:text-[#000000]">
            Need Help ?
          </a>
        </div> */}
      
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
  }
  | SidebarDropdownProps;

const SidebarLink: FunctionComponent<SidebarLinkProps> = ({
  completeHref,
  children,
  icon,
  getIsActive,
}) => {
  const pathname = usePathname();
  // ............................


  return (
    <>
    
      <Link
      href={completeHref}
      className={clsx(
        "group relative text-white  hover:bg-[#ff7702] dark:hover:bg-[#ff7702] flex items-center rounded-sm py-2 px-2 justify-center font-medium duration-300 ease-in-out",
        {
          "text-white bg-[#ff7702] rounded-xl hover:text-white ": getIsActive
            ? getIsActive(pathname, completeHref)
            : pathname.startsWith(completeHref),
          "text-white  hover:text-white ": !getIsActive
            ? pathname.startsWith(completeHref)
            : getIsActive(pathname, completeHref),
        }
      )}
      >
      {icon}
      {children}
      </Link>
      
    
      <div className="w-10 absolute hidden md:block -left-3 bg-orange h-0.5 mt-1 md:mt-2 p-0"></div>
      </>
     );
};

// const SidebarDropdown: FunctionComponent<SidebarDropdownProps> = ({
//   completeHref,
//   getIsActive,
//   icon,
//   children,
//   subItems,
// }) => {
//   const pathname = usePathname();
//   const inferOpen = useMemo(() => {
//     return subItems.some((item) => {
//       if (item.getIsActive) {
//         return item.getIsActive(pathname, completeHref);
//       } else {
//         return pathname.startsWith(item.completeHref);
//       }
//     });
//   }, [subItems, pathname]);
//   const [isOpen, setIsOpen] = useState(inferOpen);

//   return (
//     <>
//       <button
//         className={clsx(
//           "group relative w-full flex items-center gap-2.5 rounded-sm font-medium text-bodydark1 duration-300 ease-in-out hover:bg-graydark dark:hover:bg-meta-4",
//           {
//             "bg-graydark dark:bg-meta-4": inferOpen || isOpen,
//           }
//         )}
//         onClick={() => setIsOpen((prev) => !prev)}
//       >
//         {icon}
//         {children}
//         <ChevronDown
//           className={cn("ml-auto text-white", {
//             "transform rotate-180": isOpen,
//           })}
//         />
//       </button>
//       {isOpen && (
//         <ul className="mt-4 mb-5.5 flex flex-col gap-2.5 pl-6">
//           {subItems.map((item) => (
//             <li key={item.completeHref}>
//               <Link
//                 href={item.completeHref}
//                 className={cn(
//                   "group relative flex items-center gap-2.5 rounded-md px-4 font-medium text-bodydark2 duration-300 ease-in-out hover:text-white",
//                   {
//                     "text-white":
//                       item.getIsActive?.(pathname, item.completeHref) ??
//                       pathname.startsWith(item.completeHref),
//                   }
//                 )}
//               >
//                 {item.children}
//               </Link>
//             </li>
//           ))}
//         </ul>
//       )}
//     </>
//   );
// };

type SidebarMenuProps = {
  items: SidebarLinkProps[];
  title: string | React.ReactNode;
};

const SidebarMenu: FunctionComponent<SidebarMenuProps> = ({ items, title }) => {
  const { data } = useMyInfo();
  const [tooltip, setTooltip] = useState({ show: false, text: '', top: 0 });

  return (
    <>
    {tooltip.show && (
  <div
    className="fixed left-12  hidden md:flex bg-[#190237] border-2 border-orange text-white rounded-xl pl-6 pr-2 py-2 text-sm shadow-lg z-[0] pointer-events-none transition-opacity duration-300"
    style={{ top: `${tooltip.top}px`, transform: 'translateY(-50%)' }}
  >
    {tooltip.text}
  </div>
)}
      
    <div className="relative w-full h-full">
    
    <div className="gradient-border-inf py-0 lg:py-6  w-full h-full flex bg-[linear-gradient(135deg,_#4f008c,_#190237,_#190237)] justify-center gap-1 border-l-0 rounded-t-[20px]  md:rounded-l-[0px] md:rounded-r-[20px] ">
      <div className="  flex sm:flex-col justify-center sm:items-center  overflow-y-auto overflow-x-visible duration-300 ease-linear no-scrollbar py-3 w-min pr-3 pl-1   ">
        {/* <!-- Sidebar Menu --> */}
        {/* <nav className=""> */}
          {/* <!-- Menu Group --> */}
          <div >
            {/* <h3 className="mb-4 ml-4  bg-orange  text-sm font-semibold text-bodydark2">
              {title}
            </h3> */}

            <ul className="flex sm:flex-col justify-center sm:items-center gap-0 md:gap-2 md:gap-4">

              {/* <!-- Menu Item Dashboard --> */}
              {items.map(
                (item) =>
                  // <SecureFragment
                  //   permission={item.permission}
                  //   key={item.completeHref}
                  // >
                  item.permission && (
                    <>
                      <li className="has-toltib z-999 relative group" key={item.completeHref}  onMouseEnter={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          setTooltip({
            show: true,
            text: item.name,
            top: rect.top + rect.height / 2,
          });
        }}
        onMouseLeave={() => setTooltip({ ...tooltip, show: false })}>
                        {/* {item.isDropdown ? (
                          <SidebarDropdown {...item}>
                            {item.children}
                          </SidebarDropdown>
                        ) : ( */}
                          <SidebarLink {...item}>{item.children}</SidebarLink>
                        {/* )} */}
                        {/* <div className="absolute  z-[99999] left-5 top-1/2 -translate-y-1/2 ml-2 whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-300 bg-[#190237] border border-white text-white rounded px-4 py-1 text-sm  shadow-lg">
                          {item.name}
                        </div> */}
                      </li>
                    </>
                  )
              )}
            </ul>
          </div>
        {/* </nav> */}
     
      </div>
      {/* <div className="flex flex-col  overflow-y-auto duration-300 ease-linear no-scrollbar pb-4 w-min px-3 border-[#E1FE26] border-2 border-l-0 rounded-r-[20px]">
        
        <nav className="">
         
          <div>
            <h3 className="mb-4 ml-4 text-sm font-semibold text-bodydark2">
              {title}
            </h3>

            <ul className="flex flex-col gap-3.5">

            
              {items.map(
                (item) =>
                 
                  item.permission && (
                    <>
                      <li className="has-toltip" key={item.completeHref}>
                        {item.isDropdown ? (
                          <SidebarDropdown {...item}>
                            {item.children}
                          </SidebarDropdown>
                        ) : (
                          <SidebarLink {...item}>{item.children}</SidebarLink>
                        )}
                        <span className="toltip rounded px-1 py-0 bg-black text-white">
                          {item.name}
                        </span>
                      </li>
                    </>
                  )
              )}
            </ul>
          </div>
        </nav>
      </div> */}
      {/* <div className="flex flex-col gap-[31px] pt-7">
        <Link href={"/dashboard"}>
          <p>Dashboard</p>
        </Link>
        <Link href={"/subscriptions"}>
          <p>Subscriptions</p>
        </Link>
        <Link href={"/plans"}>
          <p>Buy Plan</p>
        </Link>
        <Link href={"/orders"}>
          <p>Orders</p>
        </Link>
        <Link href={"/affiliate"}>
          <p>Affiliate</p>
        </Link>
        {data?.userRole === "admin" && <Link href={"/admin"}>
          <p>Admin</p>
        </Link>}
        <Link href={"/logout"}>
          <p>Sign Out</p>
        </Link>
      </div> */}
    </div>
    </div>
   
    </>
  );
};
import { useTranslation } from 'react-i18next';

const GlobalMenu: FunctionComponent = () => {
  const { data } = useMyInfo();
    const { t } = useTranslation();
  
  const { devices, active_sessions } = useGetDevices();
 
// Simple check: if user logged in without device token, they are on main device
// Device token is stored in sessionStorage during additional device login
const isMainDevice = () => {
  
  
  // Check if user data is loaded
  if (!data) {
    
    return false;
  }
  
  // Check sessionStorage - if marked as additional device, don't show devices page
  const isAdditionalDevice = sessionStorage.getItem('isAdditionalDevice') === 'true';
  const deviceToken = sessionStorage.getItem('deviceToken');
  

  
  // Return true if this is NOT an additional device
  // (user can see devices page even without active subscription)
  return !isAdditionalDevice;
};

// Check if user has active subscriptions
const hasActiveSubscription = () => {
  if (!data) return false;
  
  const hasActivePacks = data.userPacksData?.some((pack: any) => pack.isActive === true);
  const hasActiveTools = data.userToolsData?.some((tool: any) => tool.isActive === true);
  
  return hasActivePacks || hasActiveTools;
};

  
  // const [hasMainDevice, setHasMainDevice] = useState<boolean | null>(null);

  // useEffect(() => {
  //   if ( active_sessions) {
  //     const mainDeviceExists = active_sessions?.some((d: any) => d.device_name == "Main Device" && d.is_main_device == true  );
  //     
      
  //     setHasMainDevice(mainDeviceExists);
  //   }
  // }, [active_sessions]);

  if (data)

  return (
      <SidebarMenu
        // items={[
        //   {
        //     completeHref: "/dashboard",
        //     name: "Dashboard",
        //     icon: <img className="same-size" src={image_1.src} />,
        //     children: "",
        //     permission: true,
        //   },
        //   {
        //     completeHref: "/subscriptions",
        //     name: "Subscriptions",
        //     icon: <img className="same-size" src={image_6.src} />,
        //     children: "",
        //     permission: true,
        //   },
        //   {
        //     completeHref: "/plans",
        //     name: "Available Packs",
        //     icon: <img className="same-size" src={image_7.src} />,
        //     children: "",
        //     permission: true,
        //   },
        //   {
        //     completeHref: "/orders",
        //     name: "My Orders",
        //     icon: <img className="same-size" src={image_3.src} />,
        //     children: "",
        //     permission: true,
        //   },
        //   {
        //     completeHref: "/affiliate",
        //     name: "Affiliate",
        //     icon: <img className="same-size" src={image_2.src} />,
        //     children: "",
        //     permission: true,
        //   },
        //   {
        //     completeHref: "/admin",
        //     name: "Lbrtoch",
        //     icon: <BuildingIcon className={"w-[25px] h-[25px] "} />,
        //     children: "",
        //     permission: data?.userRole === "admin" ? true : false,
        //   },
        //   {
        //     completeHref: "/logout",
        //     name: "Logout",
        //     icon: <img className="same-size" src={image_4.src} />,
        //     children: "",
        //     permission: true,
        //   },
        // ]}
        // title={""}
        items={[
          {
            completeHref: "/dashboard",
            name: t('dashboard.Dashboard'),
            icon: <House size={28} /> ,
            children: "",
            permission: true,
          
          },
          {
            completeHref: "/ai/text-to-image",
            name: "Nexus Ai",
            icon: "Ai",
            children: "",
            permission: true,
          },
          {
            completeHref: "/subscriptions",
            name: t('dashboard.Subscriptions'),
            icon: <Crown size={28} /> ,
            children: "",
            permission: true,
          },
          {
            completeHref: "/plans",
            name: t('dashboard.Plans'),
            icon: <ShoppingBag size={28} />,
            children: "",
            permission: true,
          },
         
          {
            completeHref: "/orders",
            name: t('dashboard.Orders'),
            icon: <ShoppingCart size={28} />,
            children: "",
            permission: true,
          },
          {
            completeHref: "/devices",
            name: t('dashboard.Devices'),
            icon: <Vibrate size={28} />,
            children: "",
            permission: isMainDevice()
          },
        
          
          // ...(hasMainDevice ? [{
          //   completeHref: "/devices",
          //   name: "My devices",
          //   icon: <Vibrate size={30} />,
          //   children: "",
          //   permission: true
          // }] : []),
          {
            completeHref: "/Policy",
            name: t('footer.returnPolicy'),
            icon: <ShieldCheck size={28} />,
            children: "",
            permission: true,
          },
          
          {
            completeHref: "/admin",
            name: data?.userRole === "admin" ? t('dashboard.Admin') : t('admin.manage'),
            icon: <ShieldUser size={28} />,
            children: "",
            permission: data?.userRole === "admin" || data?.userRole === "manager" || data?.userRole === "supervisor" || data?.userRole === "employee" ? true : false,
          },
          {
            completeHref: "/profile",
            name: "الملف الشخصي",
            icon: <User size={28} />,
            children: "",
            permission: true,
          },
          {
            completeHref: "/logout",
            name: t('dashboard.Logout'),
            icon: <LogOut  size={28}/>,
            children: "",
            permission: true,
          },
        ]}
        title={""}
        />
    );
};

// const ClientMenu: FunctionComponent = () => {
//   const { clientId } = useParams();

//   return (
//     <>
//       <ClientSidebarBriefing clientId={parseInt(clientId as string)} />
//       <SidebarMenu
//         items={[
//           {
//             completeHref: `/clients/${clientId}`,
//             icon: <IndividualIcons width={18} height={18} />,
//             children: "Overzicht",
//             permission: consts.CLIENT_VIEW,
//             getIsActive: (pathname) => {
//               return pathname === `/clients/${clientId}`;
//             },
//           },
//           {
//             completeHref: `/clients/${clientId}/medical-record`,
//             icon: <HeartIcon width={18} height={18} />,
//             children: "Medisch Dossier",
//             permission: consts.CLIENT_VIEW,
//             getIsActive: (pathname) => {
//               return (
//                 pathname.startsWith(`/clients/${clientId}/medical-record`) ||
//                 pathname.startsWith(`/clients/${clientId}/diagnosis`) ||
//                 pathname.startsWith(`/clients/${clientId}/medications`) ||
//                 pathname.startsWith(`/clients/${clientId}/allergies`) ||
//                 pathname.startsWith(`/clients/${clientId}/episodes`)
//               );
//             },
//           },
//           {
//             completeHref: `/clients/${clientId}/client-network`,
//             icon: <GroupIcon width={18} height={18} />,
//             children: "Cliëntennetwerk",
//             permission: consts.CLIENT_VIEW,
//             getIsActive: (pathname) => {
//               return (
//                 pathname.startsWith(`/clients/${clientId}/client-network`) ||
//                 pathname.startsWith(`/clients/${clientId}/emergency`) ||
//                 pathname.startsWith(`/clients/${clientId}/involved-employees`)
//               );
//             },
//           },
//           {
//             completeHref: `/clients/${clientId}/reports`,
//             icon: <ReportIcon height={18} width={18} />,
//             children: "Rapporten",
//             permission: consts.CLIENT_VIEW,
//           },
//           {
//             completeHref: `/clients/${clientId}/document`,
//             icon: <DocumentIcon height={18} width={18} />,
//             children: "Documenten",
//             permission: consts.CLIENT_VIEW,
//           },
//           {
//             completeHref: `/clients/${clientId}/goals`,
//             icon: <GoalIcon height={18} width={18} />,
//             children: "Doelen",
//             permission: consts.CLIENT_VIEW,
//           },
//         ]}
//         title={
//           <Link href={"/clients"} className="flex items-center">
//             <ArrowRight className="rotate-180" />
//             <span className="ml-2">TERUG NAAR CLIËNTENLIJST</span>
//             {/* BACK TO CLIENTS LIST */}
//           </Link>
//         }
//       />
//     </>
//   );
// };

// const EmployeeMenu: FunctionComponent = () => {
//   const { employeeId } = useParams();
//   return (
//     <SidebarMenu
//       items={[
//         {
//           completeHref: `/employees/${employeeId}`,
//           icon: <IndividualIcons width={18} height={18} />,
//           children: "Overzicht",
//           permission: consts.EMPLOYEE_VIEW,
//           getIsActive: (pathname) => {
//             return pathname === `/employees/${employeeId}`;
//           },
//         },
//         {
//           completeHref: `/employees/${employeeId}/certificates`,
//           icon: <CertifIcon width={18} height={18} />,
//           children: "Certificaten",
//           permission: consts.EMPLOYEE_VIEW,
//           getIsActive: (pathname) => {
//             return pathname.startsWith(`/employees/${employeeId}/certificates`);
//           },
//         },
//         {
//           completeHref: `/employees/${employeeId}/educations`,
//           icon: <EducationIcon width={18} height={18} />,
//           children: "Opleidingen",
//           permission: consts.EMPLOYEE_VIEW,
//           getIsActive: (pathname) => {
//             return pathname.startsWith(`/employees/${employeeId}/educations`);
//           },
//         },
//         {
//           completeHref: `/employees/${employeeId}/experiences`,
//           icon: <ExperienceIcon width={18} height={18} />,
//           children: "Ervaringen",
//           permission: consts.EMPLOYEE_VIEW,
//           getIsActive: (pathname) => {
//             return pathname.startsWith(`/employees/${employeeId}/experiences`);
//           },
//         },
//         {
//           completeHref: `/employees/${employeeId}/teams`,
//           icon: <RoleIcon width={18} height={18} />,
//           children: "Rollen",
//           permission: consts.ROLE_VIEW,
//           getIsActive: (pathname) => {
//             return pathname.startsWith(`/employees/${employeeId}/teams`);
//           },
//         },
//       ]}
//       title={
//         <Link href={"/employees"} className="flex items-center">
//           <ArrowRight className="rotate-180" />
//           <span className="ml-2">TERUG NAAR MEDEWERKERSLIJST</span>
//           {/* BACK TO EMPLOYEES LIST */}
//         </Link>
//       }
//     />
//   );
// };
