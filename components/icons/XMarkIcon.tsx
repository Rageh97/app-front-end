import React, { FunctionComponent } from "react";
import { IconProps } from "@/types/IconProps";
import clsx from "clsx";

const XMarkIcon: FunctionComponent<IconProps> = ({ className }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className={clsx(className ?? "w-6 h-6")}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6 18 18 6M6 6l12 12"
      />
    </svg>
  );
};

export default XMarkIcon;
