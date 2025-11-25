import React, { FunctionComponent } from "react";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import PacksForm from "@/components/forms/PacksForm";
import Panel from "@/components/Panel";

const NewPack: FunctionComponent = ({
  params,
}: {
  params: { packId: string };
}) => {
  return (
    <>
      <Breadcrumb pageName="Update Pack" />
        <Panel title="Update Existing Pack" containerClassName="max-w-[790px]">
          <PacksForm
            mode="edit"
            packId={parseInt(params.packId)}
          />
        </Panel>
    </>
  );
};

export default NewPack;
