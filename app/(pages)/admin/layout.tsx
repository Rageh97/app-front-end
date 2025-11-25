import React, { FunctionComponent, PropsWithChildren } from "react";
import AdminTabs from "@/components/AdminTabs";

type Props = {
  params: { clientId: string };
};

const AdminLayout: FunctionComponent<PropsWithChildren<Props>> = ({
  children,
  params: { clientId },
}) => {
  return (
    <div className="bg-transparent rounded-sm  shadow-2xl ">
      <AdminTabs />
      {children}
    </div>
  );
};

export default AdminLayout;
