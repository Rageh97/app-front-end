import React, { FunctionComponent, PropsWithChildren } from "react";
import { cn } from "@/utils/cn";

type Props = {
  title: string;
  header?: React.ReactNode;
  sideActions?: React.ReactNode;
  containerClassName?: string;
  className?: string;
};

const Panel: FunctionComponent<PropsWithChildren<Props>> = ({
  title,
  children,
  sideActions,
  containerClassName,
  header,
  className,
}) => {
  return (
    <div
      className={cn(
        "overflow-hidden my-4",
        className
      )}
    >
      <div className="px-4 sm:px-7 py-3 flex justify-between items-center border-b border-white/5 dark:border-zinc-800/60 mb-2">
        {header || (
          <>
            <div className="flex items-center gap-2.5 border-s-4 border-[#00c48c] ps-2.5">
              <h3 className="font-bold text-white text-base md:text-lg dark:text-zinc-100">{title}</h3>
            </div>
            <div className="text-xs sm:text-sm font-semibold">{sideActions}</div>
          </>
        )}
      </div>
      <div className={cn("dark:bg-[#12141F]/60 dark:border dark:border-zinc-800/80 dark:rounded-3xl dark:p-4 sm:dark:p-6", containerClassName)}>
        {children}
      </div>
    </div>
  );
};

export default Panel;
