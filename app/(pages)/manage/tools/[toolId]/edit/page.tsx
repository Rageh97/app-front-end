import React, { FunctionComponent } from "react";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import ToolsForm from "@/components/forms/ToolsForm";
import Panel from "@/components/Panel";

const NewTool: FunctionComponent = ({
  params,
}: {
  params: { toolId: string };
}) => {
  return (
    <>
      <Breadcrumb pageName="Update Tool" />
        <Panel title="Update Existing Tool" containerClassName="">
          <ToolsForm
            mode="edit"
            toolId={parseInt(params.toolId)}
          />
        </Panel>
    </>
  );
};

export default NewTool;
