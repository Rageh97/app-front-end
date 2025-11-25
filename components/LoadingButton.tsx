import { ChevronRight } from "lucide-react";
import { FunctionComponent } from "react";

interface LoadingButtonProps {
  isLoading?: boolean;
  isDisabled?: boolean;
  className?: string;
  onClick: Function;
  loadingPaddingX?: number;
  children: any;
}

const LoadingButton: FunctionComponent<LoadingButtonProps> = ({
  isLoading,
  isDisabled,
  className="",
  onClick,
  loadingPaddingX,
  children
}) => {
  return (
    <button
      type="submit"
      disabled={isDisabled}
      onClick={() => {
        onClick();
      }}
      className={`${className}`}
    >
      {isLoading ? (
        <div
          style={{
            marginRight: loadingPaddingX ? loadingPaddingX : 0,
            marginLeft: loadingPaddingX ? loadingPaddingX : 0,
          }}
          className="inline-block  h-[1.1rem] w-[1.1rem] animate-spin rounded-full border-[3px] border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"
        />
      ) : (
        children
      )}
    </button>
  );
};

export default LoadingButton;
