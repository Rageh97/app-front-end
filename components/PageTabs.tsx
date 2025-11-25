"use client";

import React, { FunctionComponent } from "react";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import Link from "next/link";
import ArrowRight from "@/components/icons/ArrowRight";

type Tab = {
  label: string;
  href: string;
  badge?: number;
};

type Props = {
  tabs: Tab[];
  title: string;
  backHref: string;
};

const PageTabs: FunctionComponent<Props> = ({ tabs, title, backHref }) => {
  const pathname = usePathname();
  return (
    <nav className="flex flex-wrap items-baseline justify-between gap-2 px-6 border-b-2 py-3 border-orange dark:border-strokedark ">
      <h3 className="flex items-center gap-2 text-xl font-semibold text-white dark:text-white">
        <Link href={backHref}>
          <ArrowRight className="rotate-180 text-orange" height={12} width={24} />
        </Link>
        <span>{title}</span>
      </h3>
      <ul className="flex flex-wrap gap-3 mt-3">
        {tabs.map(({ href, label, badge }, index) => (
          <li key={href}>
            <Link
              href={href}
              className={clsx(
                "block rounded-md px-5 py-2 text-sm font-medium  md:text-base lg:px-6 relative",
                pathname.startsWith(href)
                  ? "bg-[#ff7702] inner-shadow-admin text-black"
                  : "inner-shadow bg-[#35214f] text-white"
              )}
            >
              {label}
              {badge && badge > 0 && (
                <span className="absolute -top-2 -right-2 bg-red text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {badge > 10 ? '10+' : badge}
                </span>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
};

export default PageTabs;
