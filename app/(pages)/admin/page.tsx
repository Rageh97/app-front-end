import { FunctionComponent, useEffect } from "react";
import { redirect } from "next/navigation";

const Page: FunctionComponent = (props) => {
  redirect("admin/overview");
};

export default Page;
