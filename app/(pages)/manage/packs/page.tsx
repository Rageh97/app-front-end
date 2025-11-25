import { FunctionComponent } from "react";
import { redirect } from "next/navigation";

const Page: FunctionComponent = (props) => {
  redirect("packs/new");
};

export default Page;
