import React, { ButtonHTMLAttributes, FunctionComponent } from "react";
import clsx from "clsx";
import LoadingCircle from "@/components/icons/LoadingCircle";
type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  isLoading?: boolean;
  loadingText?: string;
  actionType?: "ACKNOWLEDGE" | "CANCEL" | "CANCEL-2" | "CONFIRM" | "DANGER";
};
const ModalActionButton: FunctionComponent<Props> = ({
  actionType,
  className,
  type = "button",
  isLoading,
  loadingText,
  ...props
}) => {
  return (
    <button
      {...props}
      type={type}
      className={clsx(
        "flex justify-center rounded-xl px-12.5 py-3 text-xs md:text-lg  text-center font-medium transition  disabled:bg-graydark disabled:dark:bg-whiter disabled:dark:text-black disabled:cursor-not-allowed",
        {
          "border-meta-1 text-white bg-meta-1 hover:bg-opacity-90":
            actionType === "DANGER",
          "border bg-black rounded-xl text-white hover:bg-white hover:text-primary":
            actionType === "ACKNOWLEDGE",
          "border-primary bg-primary text-white hover:bg-opacity-90":
            actionType === "CONFIRM",
          "bg-gray text-black hover:bg-meta-1 hover:text-white":
            actionType === "CANCEL",
          "bg-gray-2 text-black hover:bg-meta-1 hover:text-white":
            actionType === "CANCEL-2",
        },
        className
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
        props.children
      )}
    </button>
  );
};

export default ModalActionButton;
