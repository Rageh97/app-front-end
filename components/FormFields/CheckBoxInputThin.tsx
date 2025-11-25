import React, { FunctionComponent, InputHTMLAttributes, useState } from "react";

type CheckBoxInputFieldType = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
};

const CheckBoxInputFieldThin: FunctionComponent<CheckBoxInputFieldType> = ({
  label,
  className,
  id,
  required,
  error,
  ...props
}) => {
  return (
    <div className={className}>
      <label className="flex items-center cursor-pointer">
        <input
          type="checkbox"
          {...props}
          id={id}
          required={required}
          className="w-[19px] h-[19px] mx-2 cursor-pointer"
        />
        {label}
      </label>
    </div>
  );
};

export default CheckBoxInputFieldThin;
