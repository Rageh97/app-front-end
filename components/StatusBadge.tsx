import React, { FunctionComponent, ReactNode, useMemo } from "react";
import { BadgeType } from "@/types/badge-type";

type BadgeProps = {
  text: ReactNode;
};

type Props = BadgeProps & {
  type: BadgeType;
};

const BadgesRecord: Record<Props["type"], FunctionComponent<BadgeProps>> = {
  Primary: ({ text }) => (
    <div className="inline-flex rounded-full bg-primary py-1 px-3 text-sm font-medium text-white hover:bg-opacity-90">
      {text}
    </div>
  ),
  Secondary: ({ text }) => (
    <div className="inline-flex rounded-full bg-[#13C296] py-1 px-3 text-sm font-medium text-white hover:bg-opacity-90">
      {text}
    </div>
  ),
  Success: ({ text }) => (
    <div className="inline-flex rounded-full bg-[#3CA745] py-1 px-3 text-sm font-medium text-white hover:bg-opacity-90">
      {text}
    </div>
  ),
  Dark: ({ text }) => (
    <div className="inline-flex rounded-full bg-[#212B36] py-1 px-3 text-sm font-medium text-white hover:bg-opacity-90">
      {text}
    </div>
  ),
  Light: ({ text }) => (
    <div className="inline-flex rounded-full bg-[#EFEFEF] py-1 px-3 text-sm font-medium text-[#212B36] hover:bg-opacity-90">
      {text}
    </div>
  ),
  Gray: ({ text }) => (
    <div className="inline-flex rounded-full bg-[#637381] py-1 px-3 text-sm font-medium text-white hover:bg-opacity-90">
      {text}
    </div>
  ),
  Danger: ({ text }) => (
    <div className="inline-flex rounded-full bg-[#DC3545] py-1 px-3 text-sm font-medium text-white hover:bg-opacity-90">
      {text}
    </div>
  ),
  Warning: ({ text }) => (
    <div className="inline-flex rounded-full bg-[#F9C107] py-1 px-3 text-sm font-medium text-[#212B36] hover:bg-opacity-90">
      {text}
    </div>
  ),
  Info: ({ text }) => (
    <div className="inline-flex rounded-full bg-[#3BA2B8] py-1 px-3 text-sm font-medium text-white hover:bg-opacity-90">
      {text}
    </div>
  ),
};

const StatusBadge: FunctionComponent<Props> = ({ type, text }) => {
  const Badge = useMemo(() => BadgesRecord[type] ?? BadgesRecord.Light, [type]);
  return <Badge text={text} />;
};

export default StatusBadge;
