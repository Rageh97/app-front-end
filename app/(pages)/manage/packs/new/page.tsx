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
      <Breadcrumb pageName="New Pack" />
        <Panel title="Add New Pack" containerClassName="max-w-[790px]">
          <PacksForm
            mode="new"
            packId={parseInt(params.packId)}
          />
        </Panel>
    </>
  );
};

export default NewPack;
