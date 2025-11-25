import React, { FunctionComponent } from "react";
import clsx from "clsx";

type Props = {
  pinging?: boolean;
  className?: string; // need to provide a position here, if no className provided defaults to "relative",
};

const Ping: FunctionComponent<Props> = ({ pinging = false, className }) => {
  return (
    <span
      className={clsx(
        "h-2 w-2 rounded-full bg-meta-1",
        pinging === false ? "hidden" : "inline",
        className ?? "relative"
      )}
    >
      <span className="absolute -z-1 inline-flex h-full w-full animate-ping rounded-full bg-meta-1 opacity-75"></span>
    </span>
  );
};

export default Ping;
