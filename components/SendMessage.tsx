import React, { FunctionComponent } from "react";
import Image from "next/image";

type Props = {
  firstLine: string;
  secondLine: string;
};

const SendMessage: FunctionComponent<Props> = ({ firstLine, secondLine }) => {
  return (
    <div className="bg-white flex items-center h-full px-5 py-10">
      <div className="mx-auto max-w-[490px]">
        <Image
          width={400}
          height={400}
          className={"mx-auto w-[60%]"}
          src={"/images/illustration/illustration-02.svg"}
          alt="illustration"
        />

        <div className="mt-7.5 text-center">
          <h2 className="mb-3 text-2xl font-bold text-black dark:text-white">
            {firstLine}
          </h2>
          <p className="font-medium">{secondLine}</p>
        </div>
      </div>
    </div>
  );
};

export default SendMessage;
