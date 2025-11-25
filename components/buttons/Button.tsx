import React, { ButtonHTMLAttributes, FunctionComponent } from "react";
import LoadingCircle from "@/components/icons/LoadingCircle";
import { ButtonType } from "@/types/button-type";
import { BUTTON_CLASS_NAMES } from "@/consts";
import { cn } from "@/utils/cn";

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  isLoading?: boolean;
  loadingText?: string;
  buttonType?: ButtonType;
};

const Button: FunctionComponent<ButtonProps> = ({
  isLoading = false,
  children,
  type = "button",
  loadingText,
  buttonType,
  ...props
}) => {
  return (
    <button
      type={type}
      {...props}
      className={cn(
        "flex justify-center px-10 py-3 font-medium rounded bg-primary text-gray ",
        BUTTON_CLASS_NAMES[buttonType ?? "Primary"] ??
          BUTTON_CLASS_NAMES.Primary,
        props.className
      )}
    >
      {isLoading ? (
        <>
          <span className="animate-spin">
            <LoadingCircle />
          </span>
          <span className="ml-2">{loadingText ?? "Loading..."}</span>
        </>
      ) : (
        children
      )}
    </button>
  );
};

export default Button;
