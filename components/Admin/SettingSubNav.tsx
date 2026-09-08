'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import {
  Image,
  Bell,
  Share2,
  Tv,
  FileText,
  ShieldCheck,
  Wrench
} from 'lucide-react';

export const SettingSubNav = () => {
  const pathname = usePathname();
  const { t } = useTranslation();

  const navItems = [
    { href: '/admin/setting/logo', label: t('settings.logo') || 'الشعار', icon: Image },
    { href: '/admin/setting/notifications', label: t('settings.notifications') || 'الإشعارات', icon: Bell },
    { href: '/admin/setting/socialLinks', label: t('settings.socialLinks') || 'روابط التواصل', icon: Share2 },
    { href: '/admin/setting/banners', label: t('settings.banners') || 'البنرات', icon: Tv },
    { href: '/admin/setting/policy', label: t('footer.returnPolicy') || 'سياسة الاسترجاع', icon: FileText },
    { href: '/admin/setting/condition', label: t('footer.returnCondition') || 'شروط الاسترجاع', icon: ShieldCheck },
    { href: '/admin/setting', label: 'وضع الصيانة', icon: Wrench, exact: true },
  ];

  return (
    <div className="flex items-center justify-center flex-wrap gap-2 pb-4">
      {navItems.map((item) => {
        const isActive = item.exact
          ? pathname === item.href
          : pathname === item.href || (item.href !== '/admin/setting' && pathname?.startsWith(item.href));
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-md border transition-all duration-150 ${
              isActive
                ? 'bg-[#00c48c] text-zinc-950 font-bold border-[#00c48c] shadow-sm'
                : 'bg-[#121620] hover:bg-[#181e2c] text-zinc-300 border-zinc-800 hover:text-white'
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </div>
  );
};

export default SettingSubNav;
