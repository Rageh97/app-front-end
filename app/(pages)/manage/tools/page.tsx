import { FunctionComponent } from "react";
import { redirect } from "next/navigation";

const Page: FunctionComponent = (props) => {
  redirect("tools/new");
};

export default Page;
