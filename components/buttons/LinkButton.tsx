import React, { FunctionComponent } from "react";
import Link from "next/link";
import clsx from "clsx";

type Props = {
  text: string;
  href: string;
  className?: string;
};

const LinkButton: FunctionComponent<Props> = ({ text, href, className }) => {
  return (
    <Link
      href={href}
      className={clsx(
      "skew-x-[50deg] px-3 py-2",
        className
      )}
    >
      {text}
    </Link>
  );
};

export default LinkButton;
