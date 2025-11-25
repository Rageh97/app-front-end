import React, { FunctionComponent, TextareaHTMLAttributes } from "react";

type Props = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string;
  placeholder?: string;
  error?: any;
};

const Textarea: FunctionComponent<Props> = ({
  label,
  id,
  className,
  required,
  error,
  ...props
}) => {
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-2.5 block text-white dark:text-white">
        {label} {required && <span className="text-meta-1">*</span>}
      </label>
      <textarea
        {...props}
        required={required}
        id={id}
        className="w-full rounded bg-white border-[1.5px] border-black bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
      ></textarea>
      {error && (
        <p role="alert" className="pt-1 text-red">
          {error}
        </p>
      )}
    </div>
  );
};

export default Textarea;
