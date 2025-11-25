"use client";

import React, { FunctionComponent, useCallback, useEffect } from "react";
import Panel from "@/components/Panel";
import InputField from "@/components/FormFields/InputField";
import Textarea from "@/components/FormFields/Textarea";
import { useGetRelease } from "@/utils/release/getTool";
import * as Yup from "yup";
import { Formik } from "formik";
import { useUpdateRelease } from "@/utils/release/updateRelease";
import Button from "@/components/buttons/Button";

type Props = {
  params: { clientId: string };
};

const ReleasesPage: FunctionComponent<Props> = () => {
  const { isFetching, data: releaseData, refetch } = useGetRelease();
  const { mutate: update, isLoading: isPatching } = useUpdateRelease();

  useEffect(() => {
    refetch();
  }, []);

  const initialValues = {
    version: "",
    main: "",
    preload: "",
  };

  const goalsSchema = Yup.object().shape({
    version: Yup.string().required("Enter something"),
    main: Yup.string().required("Enter something"),
    preload: Yup.string().required("Enter something"),
  });

  const onSubmit = useCallback(
    (values: any) => {
      update(
        {
          ...values,
        },
        {
          onSuccess: () => {
            alert("updated !!!");
          },
        }
      );
    },
    [update]
  );

  return (
    <Panel
      title={"Configurations"}
      sideActions={
        <>
          {isFetching && (
            <div className="inline-block h-[1.1rem] w-[1.1rem] animate-spin rounded-full border-[3px] border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
          )}
        </>
      }
    >
      <Formik
        enableReinitialize={true}
        initialValues={releaseData ? releaseData : initialValues}
        onSubmit={onSubmit}
        validationSchema={goalsSchema}
      >
        {({
          values,
          handleChange,
          handleBlur,
          touched,
          handleSubmit,
          errors,
        }) => (
          <form onSubmit={handleSubmit} className="flex">
            <div className="w-full gap-4 p-5">
              <InputField
                className={"w-full mb-4.5"}
                label={"Updated version"}
                type={"text"}
                placeholder={"Enter Version"}
                id="version"
                name="version"
                value={values.version}
                onChange={handleChange}
                onBlur={handleBlur}
                error={touched.version && errors.version}
              />
              <Textarea
                rows={7}
                className={"w-full mb-4.5"}
                label={"Updated main code"}
                placeholder={"Enter main Code"}
                id="main"
                name="main"
                value={values.main}
                onChange={handleChange}
                onBlur={handleBlur}
                error={touched.main && errors.main}
              />
              <Textarea
                rows={7}
                className={"w-full mb-4.5"}
                label={"Updated preload code"}
                placeholder={"Enter preload Code"}
                id="preload"
                name="preload"
                value={values.preload}
                onChange={handleChange}
                onBlur={handleBlur}
                error={touched.preload && errors.preload}
              />
              <Button
                type={"submit"}
                style={{ marginTop: "17px" }}
                disabled={isPatching}
                isLoading={isPatching}
                formNoValidate={true}
                loadingText={"Updating ..."}
              >
                {"Update Release"}
              </Button>
            </div>
          </form>
        )}
      </Formik>
    </Panel>
  );
};

export default ReleasesPage;
