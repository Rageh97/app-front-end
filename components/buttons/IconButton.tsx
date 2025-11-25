import React, { FunctionComponent } from "react";
import { ButtonProps } from "@/components/buttons/Button";
import LoadingCircle from "@/components/icons/LoadingCircle";
import clsx from "clsx";
import { BUTTON_CLASS_NAMES } from "@/consts";

const IconButton: FunctionComponent<ButtonProps> = ({
  isLoading = false,
  children,
  type = "button",
  buttonType,
  ...props
}) => {
  return (
    <button
      type={type}
      {...props}
      className={clsx(
        props.className,
        "flex justify-center p-2 font-medium  rounded-full",
        BUTTON_CLASS_NAMES[buttonType ?? "Primary"] ??
          BUTTON_CLASS_NAMES.Primary,
      )}
    >
      {isLoading ? (
        <>
          <span className="animate-spin">
            <LoadingCircle className={"w-5 h-5"} />
          </span>
        </>
      ) : (
        children
      )}
    </button>
  );
};

export default IconButton;
