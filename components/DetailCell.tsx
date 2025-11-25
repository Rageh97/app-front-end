import React, { FunctionComponent, useMemo } from "react";
import clsx from "clsx";

type ValueType = "text" | "email" | "phone";
type StrategyProps = {
  value: string;
};

const Strategies: Record<ValueType, FunctionComponent<StrategyProps>> = {
  text: ({ value }) => (
    <div className="mt-1 text-sm text-[#00c48c] truncate">
      {value}
    </div>
  ),
  email: ({ value }) => (
    <div className="mt-1 text-sm text-[#00c48c] truncate ">
      <a
        href={`mailto:${value}`}
        className="text-[#00c48c] underline hover:opacity-80"
      >
        {value}
      </a>
    </div>
  ),
  phone: ({ value }) => (
    <div className="mt-1 text-sm text-[#00c48c] truncate ">
      <a
        href={`tel:${value}`}
        className="text-[#00c48c] underline hover:opacity-80"
      >
        {value}
      </a>
    </div>
  ),
};

type Props = {
  label: string | React.ReactNode;
  value: string | React.ReactNode;
  additionalInfo?: string | React.ReactNode;
  className?: string;
  ignoreIfEmpty?: boolean;
  type?: ValueType;
};

const DetailCell: FunctionComponent<Props> = ({
  label,
  value,
  additionalInfo,
  className,
  ignoreIfEmpty,
  type = "text",
}) => {
  const Strategy = useMemo(() => Strategies[type], [type]);

  if (!ignoreIfEmpty && (value === null || value === undefined || value === ""))
    return null;
  return (
    <div className={className}>
      {typeof label === "string" ? (
        <div className="text-sm font-medium  text-white overflow-ellipsis">
          {label}
        </div>
      ) : (
        label
      )}
      {typeof value === "string" ? <Strategy value={value} /> : value}
      {typeof additionalInfo === "string" && (
        <div className="mt-1 text-sm  text-white ">
          {additionalInfo}
        </div>
      )}
    </div>
  );
};

export default DetailCell;
