import { FunctionComponent } from "react";
import { redirect } from "next/navigation";

const Page: FunctionComponent = (props) => {
  redirect("admin/tools");
};

export default Page;
