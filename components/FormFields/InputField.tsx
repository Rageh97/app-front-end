import React, { FunctionComponent, InputHTMLAttributes } from "react";
import clsx from "clsx";

type InputFieldType = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: any;
  isPrice?: boolean;
};

const InputField: FunctionComponent<InputFieldType> = ({
  label,
  className,
  id,
  required,
  error,
  isPrice,
  form,
  ...props
}) => {
  return (
    <div className={className}>
      {label && (
        <label htmlFor={id} className="mb-2.5 block text-white dark:text-white">
          {label} {required && <span className="text-meta-1">*</span>}
        </label>
      )}
      <div className="relative">
        {isPrice && (
          <span className="absolute top-1/2 right-4 z-30 -translate-y-1/2 pointer-events-none">
            <span className="text-graydark font-bold text-xl dark:text-white">
              €
            </span>
          </span>
        )}
        <input
          {...props}
          id={id}
          data-is-price={isPrice}
          required={required}
          aria-label={label || props.placeholder}
          className={clsx(
            "w-full rounded border-[1.5px] border-black bg-white py-3 px-5 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
          )}
        />
      </div>
      {error && (
        <p role="alert" className="pt-1 text-red">
          {error}
        </p>
      )}
    </div>
  );
};

export default InputField;
