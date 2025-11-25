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
        " overflow-hidden   ",
        className
      )}
    >
      <div className=" px-7 py-3 flex justify-between items-center">
        {header || (
          <>
            <h3 className="font-medium text-white">{title}</h3>
            <div>{sideActions}</div>
          </>
        )}
      </div>
      <div className={containerClassName}>{children}</div>
    </div>
  );
};

export default Panel;
