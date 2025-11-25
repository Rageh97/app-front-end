'use client';

import Link from "next/link";
import { useTranslation } from "react-i18next";

const Setting = () => {
    const { t } = useTranslation();

    return (
        <div className="flex items-center justify-center flex-wrap md:gap-5 gap-2 p-5">
           <Link className="text-white text-xs md:text-lg inner-shadow bg-[#35214f] md:px-5 px-2 py-2 rounded-md" href="/admin/setting/logo">
             {t('settings.logo')}
           </Link>
           <Link className="text-white text-xs md:text-lg inner-shadow bg-[#35214f] md:px-5 px-2 py-2 rounded-md" href="/admin/setting/socialLinks">
             {t('settings.socialLinks')}
           </Link>
           <Link className="text-white text-xs md:text-lg inner-shadow bg-[#35214f] md:px-5 px-2 py-2 rounded-md" href="/admin/setting/banners">
             {t('settings.banners')}
           </Link>
           <Link className="text-white text-xs md:text-lg inner-shadow bg-[#35214f] md:px-5 px-2 py-2 rounded-md" href="/admin/setting/notifications">
             {t('settings.notifications')}
           </Link>
           <Link className="text-white text-xs md:text-lg inner-shadow bg-[#35214f] md:px-5 px-2 py-2 rounded-md" href="/admin/setting/policy">
           {t('footer.returnPolicy')}
           </Link>
           <Link className="text-white text-xs md:text-lg inner-shadow bg-[#35214f] md:px-5 px-2 py-2 rounded-md" href="/admin/setting/condition">
           {t('footer.returnCondition')}
           </Link>
          
         
        </div>
    );
};

export default Setting;