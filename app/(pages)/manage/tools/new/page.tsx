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
      <Breadcrumb  pageName="New Tool" />

        <Panel title="Add New Tool" containerClassName="">
          <ToolsForm
            mode="new"
            toolId={parseInt(params.toolId)}
          />
        </Panel>
    </>
  );
};

export default NewTool;
