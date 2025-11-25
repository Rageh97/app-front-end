import React, { FunctionComponent, InputHTMLAttributes } from "react";
import CheckIcon from "@/components/icons/CheckIcon";
import clsx from "clsx";

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  type?: "checkbox";
  label: string;
}

const CheckboxItem: FunctionComponent<Props> = ({ id, label, ...props }) => {
  return (
    <label htmlFor={id} className="flex cursor-pointer">
      <div className="relative pt-0.5">
        <input {...props} id={id} className="sr-only taskCheckbox" />
        <div
          className={clsx(
            "flex items-center justify-center w-5 h-5 mr-3 border rounded box",
            {
              "border-primary bg-primary dark:border-primary": props.checked,
              "border-stroke dark:border-strokedark": !props.checked,
            }
          )}
        >
          <span className="text-white opacity-100">
            <CheckIcon />
          </span>
        </div>
      </div>
      <p>{label}</p>
    </label>
  );
};

export default CheckboxItem;
