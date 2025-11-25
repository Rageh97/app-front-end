import React, { FunctionComponent, PropsWithChildren } from "react";

const AuthLayout: FunctionComponent<PropsWithChildren> = ({ children }) => {
  return (
      <main className="h-[100vh]">{children}</main>
  );
};

export default AuthLayout;
