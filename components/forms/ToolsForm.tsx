"use client";

import * as Yup from "yup";
import React, { FunctionComponent, useCallback, useState } from "react";
import { Formik } from "formik";
import InputField from "@/components/FormFields/InputField";
import Textarea from "@/components/FormFields/Textarea";
import { FormikHelpers } from "formik/dist/types";
import Button from "@/components/buttons/Button";
import { NewToolsReqDto } from "@/types/tools/new-tools-req-dto";
import { useCreateTool } from "@/utils/tool/createTool";
import { useRouter } from "next/navigation";
import { useGetTool } from "@/utils/tool/getTool";
import { useUpdateTool } from "@/utils/tool/updateTool";
import FormikCheckboxItem from "../FormFields/FormikCheckboxItem";
import FormikRadioGroup from "../FormFields/FormikRadioGroup";
import { PLANS_OPTIONS, TOOL_MODE_OPTIONS } from "@/consts";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { useTranslation } from "react-i18next";

type FormType = NewToolsReqDto;

export type ToolsFormType = FormType;

const initialValues: FormType = {
  tool_name: "",
  tool_category: "",
  tool_plan: "",
  tool_mode: "",
  tool_url: "",
  tool_auth: "",
  tool_login_url: "",
  tool_image: "",
  tool_day_price: 0,
  tool_month_price: 0,
  tool_none_price_month: 0,
  tool_year_price: 0,
  tool_none_price_year: 0,
  tool_data: "",
  tool_local_storage: "",
  tool_blocked_urls: "",
  tool_blocked_elements: "",
  tool_external_links: "",
  tool_content: "",
  tool_description: "",
  isActive: true,
  isStable: true,
  isLink: true,
  additional_device_price: "5",
  max_devices: 11,
  cookie_1: "",
  cookie_2: "",
  cookie_3: "",
  cookie_4: "",
  cookie_5: "",
  cookie_6: "",
  cookie_7: "",
  cookie_8: "",
  cookie_9: "",
  cookie_10: "",
  cookie_11: "",
  cookie_12: "",
  cookie_13: "",
  cookie_14: "",
  cookie_15: "",
  cookie_16: "",
  cookie_17: "",
  cookie_18: "",
  cookie_19: "",
  cookie_20: "",

  local_storage_1: "",

  blocked_url_1: "",
  blocked_url_2: "",
  blocked_url_3: "",
  blocked_url_4: "",
  blocked_url_5: "",
  blocked_url_6: "",
  blocked_url_7: "",
  blocked_url_8: "",
  blocked_url_9: "",
  blocked_url_10: "",

  blocked_element_1: "",
  blocked_element_2: "",
  blocked_element_3: "",
  blocked_element_4: "",
  blocked_element_5: "",
  blocked_element_6: "",
  blocked_element_7: "",
  blocked_element_8: "",
  blocked_element_9: "",
  blocked_element_10: "",

  external_link_1: "",
  external_link_2: "",
  external_link_3: "",
  external_link_4: "",
  external_link_5: "",
  external_link_6: "",
  external_link_7: "",
  external_link_8: "",
  external_link_9: "",
  external_link_10: "",
};

export const goalsSchema: Yup.ObjectSchema<FormType> = Yup.object().shape({
  tool_id: Yup.number(),
  tool_name: Yup.string().required("Please enter tool name."),
  tool_category: Yup.string().required("Please select tool category."),
  tool_plan: Yup.string().required("Please enter tool plan."),
  tool_mode: Yup.string().required("Please select tool mode."),
  tool_url: Yup.string().required("Please enter dashboard url."),
  tool_login_url: Yup.string().required("Please enter login url."),
  tool_image: Yup.string().required("Please enter tool image."),
  tool_day_price: Yup.number(),
  tool_auth: Yup.string(),
  tool_month_price: Yup.number().required("Please enter tool month price."),
  tool_none_price_month: Yup.number().required(
    "Please enter tool none price month."
  ),
  tool_year_price: Yup.number().required("Please enter tool year price."),
  tool_none_price_year: Yup.number().required(
    "Please enter tool none price year."
  ),
  tool_data: Yup.string(),
  tool_local_storage: Yup.string(),
  tool_blocked_urls: Yup.string(),
  tool_blocked_elements: Yup.string(),
  tool_external_links: Yup.string(),
  tool_content: Yup.string().required("Please enter tool content."),
  tool_description: Yup.string().required("Please enter tool description."),
  isLink: Yup.boolean(),
  isActive: Yup.boolean(),
  isStable: Yup.boolean(),
  additional_device_price: Yup.string(),
  max_devices: Yup.number(),
  cookie_1: Yup.string(),
  cookie_2: Yup.string(),
  cookie_3: Yup.string(),
  cookie_4: Yup.string(),
  cookie_5: Yup.string(),
  cookie_6: Yup.string(),
  cookie_7: Yup.string(),
  cookie_8: Yup.string(),
  cookie_9: Yup.string(),
  cookie_10: Yup.string(),
  cookie_11: Yup.string(),
  cookie_12: Yup.string(),
  cookie_13: Yup.string(),
  cookie_14: Yup.string(),
  cookie_15: Yup.string(),
  cookie_16: Yup.string(),
  cookie_17: Yup.string(),
  cookie_18: Yup.string(),
  cookie_19: Yup.string(),
  cookie_20: Yup.string(),

  local_storage_1: Yup.string(),

  email_path: Yup.string(),
  password_path: Yup.string(),
  button_path: Yup.string(),
  email_1: Yup.string(),
  password_1: Yup.string(),
  email_2: Yup.string(),
  password_2: Yup.string(),
  email_3: Yup.string(),
  password_3: Yup.string(),
  email_4: Yup.string(),
  password_4: Yup.string(),
  email_5: Yup.string(),
  password_5: Yup.string(),
  email_6: Yup.string(),
  password_6: Yup.string(),
  email_7: Yup.string(),
  password_7: Yup.string(),
  email_8: Yup.string(),
  password_8: Yup.string(),
  email_9: Yup.string(),
  password_9: Yup.string(),
  email_10: Yup.string(),
  password_10: Yup.string(),

  blocked_url_1: Yup.string(),
  blocked_url_2: Yup.string(),
  blocked_url_3: Yup.string(),
  blocked_url_4: Yup.string(),
  blocked_url_5: Yup.string(),
  blocked_url_6: Yup.string(),
  blocked_url_7: Yup.string(),
  blocked_url_8: Yup.string(),
  blocked_url_9: Yup.string(),
  blocked_url_10: Yup.string(),

  blocked_element_1: Yup.string(),
  blocked_element_2: Yup.string(),
  blocked_element_3: Yup.string(),
  blocked_element_4: Yup.string(),
  blocked_element_5: Yup.string(),
  blocked_element_6: Yup.string(),
  blocked_element_7: Yup.string(),
  blocked_element_8: Yup.string(),
  blocked_element_9: Yup.string(),
  blocked_element_10: Yup.string(),

  external_link_1: Yup.string(),
  external_link_2: Yup.string(),
  external_link_3: Yup.string(),
  external_link_4: Yup.string(),
  external_link_5: Yup.string(),
  external_link_6: Yup.string(),
  external_link_7: Yup.string(),
  external_link_8: Yup.string(),
  external_link_9: Yup.string(),
  external_link_10: Yup.string(),
});

type PropsType = {
  mode: string;
  toolId?: number;
};

export const ToolsForm: FunctionComponent<PropsType> = ({ mode, toolId }) => {
  const router = useRouter();
  const { t } = useTranslation();

  const [isLocalStorageError, setIsLocalStorageError] = useState<boolean>(false);
  const [isCookiesError, setIsCookiesError] = useState<boolean>(false);

  const {
    data,
    isLoading: isDataLoading,
    isError,
  } = useGetTool(!isNaN(toolId) ? toolId : 1);

  const { mutate: create, isLoading: isCreating } = useCreateTool();
  const { mutate: update, isLoading: isPatching } = useUpdateTool();

  const onSubmit = useCallback(
    (values: FormType, { resetForm }: FormikHelpers<FormType>) => {
      // local storage data
      let toolLocalStorage: any[] = [];

      if (
        values?.["local_storage_1"] !== "" &&
        values?.["local_storage_1"] != undefined
      ) {
        toolLocalStorage.push(values?.["local_storage_1"]);
      }

      values.tool_local_storage = JSON.stringify(toolLocalStorage);

      if (values.tool_local_storage === "[]") {
        setIsLocalStorageError(true);
        return;
      } else {
        setIsLocalStorageError(false);
      }

      // cookies data
      let toolCookies: any[] = [];

      for (let i = 1; i <= 20; i++) {
        if (
          values?.["cookie_" + i] !== "" &&
          values?.["cookie_" + i] != undefined
        ) {
          toolCookies.push(values?.["cookie_" + i]);
        }
      }

      values.tool_data = JSON.stringify(toolCookies);

      if (values.tool_data === "[]") {
        setIsCookiesError(true);
        return;
      } else {
        setIsCookiesError(false);
      }

      // Auth data
      let toolAuths: any[] = [];

      toolAuths.push({
        email_path: values?.["email_path"],
        password_path: values?.["password_path"],
        button_path: values?.["button_path"],
      });

      for (let i = 1; i <= 10; i++) {
        if (values?.["email_" + i] && values?.["password_" + i]) {
          toolAuths.push({
            email: values?.["email_" + i],
            password: values?.["password_" + i],
          });
        }
      }

      values.tool_auth = JSON.stringify(toolAuths);

      // blocked urls
      let toolBlockedUrls: any[] = [];

      for (let i = 1; i <= 10; i++) {
        if (
          values?.["blocked_url_" + i] !== "" &&
          values?.["blocked_url_" + i] != undefined
        ) {
          toolBlockedUrls.push(values?.["blocked_url_" + i]);
        }
      }

      values.tool_blocked_urls = JSON.stringify(toolBlockedUrls);

      // blocked elements
      let toolBlockedElements: any[] = [];

      for (let i = 1; i <= 10; i++) {
        if (
          values?.["blocked_element_" + i] !== "" &&
          values?.["blocked_element_" + i] != undefined
        ) {
          toolBlockedElements.push(values?.["blocked_element_" + i]);
        }
      }

      values.tool_blocked_elements = JSON.stringify(toolBlockedElements);

      // external links
      let toolExternalLinks: any[] = [];

      for (let i = 1; i <= 10; i++) {
        if (
          values?.["external_link_" + i] !== "" &&
          values?.["external_link_" + i] != undefined
        ) {
          toolExternalLinks.push(values?.["external_link_" + i]);
        }
      }

      values.tool_external_links = JSON.stringify(toolExternalLinks);

      // Debug log for additional device settings
      console.log('📤 ToolsForm - Sending to backend:', {
        additional_device_price: values.additional_device_price,
        max_devices: values.max_devices,
        tool_name: values.tool_name
      });

      /////////////////
      if (mode === "edit") {
        update(
          {
            ...values,
            tool_id: toolId,
          },
          {
            onSuccess: () => {
              resetForm;
              router.push(`/admin/tools`);
            },
          }
        );
      } else if (mode === "new") {
        create(values, {
          onSuccess: () => {
            resetForm;
            router.push(`/admin/tools`);
          },
        });
      }
    },
    [create]
  );

  const patchCookiesData = (data: any) => {
    data.local_storage_1 = JSON.parse(data?.tool_local_storage ? data?.tool_local_storage : '[]')[0];

    data.cookie_1 = JSON.parse(data?.tool_data)[0];
    data.cookie_2 = JSON.parse(data?.tool_data)[1];
    data.cookie_3 = JSON.parse(data?.tool_data)[2];
    data.cookie_4 = JSON.parse(data?.tool_data)[3];
    data.cookie_5 = JSON.parse(data?.tool_data)[4];
    data.cookie_6 = JSON.parse(data?.tool_data)[5];
    data.cookie_7 = JSON.parse(data?.tool_data)[6];
    data.cookie_8 = JSON.parse(data?.tool_data)[7];
    data.cookie_9 = JSON.parse(data?.tool_data)[8];
    data.cookie_10 = JSON.parse(data?.tool_data)[9];
    data.cookie_11 = JSON.parse(data?.tool_data)[10];
    data.cookie_12 = JSON.parse(data?.tool_data)[11];
    data.cookie_13 = JSON.parse(data?.tool_data)[12];
    data.cookie_14 = JSON.parse(data?.tool_data)[13];
    data.cookie_15 = JSON.parse(data?.tool_data)[14];
    data.cookie_16 = JSON.parse(data?.tool_data)[15];
    data.cookie_17 = JSON.parse(data?.tool_data)[16];
    data.cookie_18 = JSON.parse(data?.tool_data)[17];
    data.cookie_19 = JSON.parse(data?.tool_data)[18];
    data.cookie_20 = JSON.parse(data?.tool_data)[19];

    data.blocked_url_1 = JSON.parse(data?.tool_blocked_urls)[0];
    data.blocked_url_2 = JSON.parse(data?.tool_blocked_urls)[1];
    data.blocked_url_3 = JSON.parse(data?.tool_blocked_urls)[2];
    data.blocked_url_4 = JSON.parse(data?.tool_blocked_urls)[3];
    data.blocked_url_5 = JSON.parse(data?.tool_blocked_urls)[4];
    data.blocked_url_6 = JSON.parse(data?.tool_blocked_urls)[5];
    data.blocked_url_7 = JSON.parse(data?.tool_blocked_urls)[6];
    data.blocked_url_8 = JSON.parse(data?.tool_blocked_urls)[7];
    data.blocked_url_9 = JSON.parse(data?.tool_blocked_urls)[8];
    data.blocked_url_10 = JSON.parse(data?.tool_blocked_urls)[9];

    try {
      data.blocked_element_1 = JSON.parse(data?.tool_blocked_elements)[0];
      data.blocked_element_2 = JSON.parse(data?.tool_blocked_elements)[1];
      data.blocked_element_3 = JSON.parse(data?.tool_blocked_elements)[2];
      data.blocked_element_4 = JSON.parse(data?.tool_blocked_elements)[3];
      data.blocked_element_5 = JSON.parse(data?.tool_blocked_elements)[4];
      data.blocked_element_6 = JSON.parse(data?.tool_blocked_elements)[5];
      data.blocked_element_7 = JSON.parse(data?.tool_blocked_elements)[6];
      data.blocked_element_8 = JSON.parse(data?.tool_blocked_elements)[7];
      data.blocked_element_9 = JSON.parse(data?.tool_blocked_elements)[8];
      data.blocked_element_10 = JSON.parse(data?.tool_blocked_elements)[9];

      data.external_link_1 = JSON.parse(data?.tool_external_links)[0];
      data.external_link_2 = JSON.parse(data?.tool_external_links)[1];
      data.external_link_3 = JSON.parse(data?.tool_external_links)[2];
      data.external_link_4 = JSON.parse(data?.tool_external_links)[3];
      data.external_link_5 = JSON.parse(data?.tool_external_links)[4];
      data.external_link_6 = JSON.parse(data?.tool_external_links)[5];
      data.external_link_7 = JSON.parse(data?.tool_external_links)[6];
      data.external_link_8 = JSON.parse(data?.tool_external_links)[7];
      data.external_link_9 = JSON.parse(data?.tool_external_links)[8];
      data.external_link_10 = JSON.parse(data?.tool_external_links)[9];
    } catch (error) { }

    data.email_path = JSON.parse(data?.tool_auth)[0]?.email_path;
    data.password_path = JSON.parse(data?.tool_auth)[0]?.password_path;
    data.button_path = JSON.parse(data?.tool_auth)[0]?.button_path;

    data.email_1 = JSON.parse(data?.tool_auth)[1]?.email;
    data.password_1 = JSON.parse(data?.tool_auth)[1]?.password;
    data.email_2 = JSON.parse(data?.tool_auth)[2]?.email;
    data.password_2 = JSON.parse(data?.tool_auth)[2]?.password;
    data.email_3 = JSON.parse(data?.tool_auth)[3]?.email;
    data.password_3 = JSON.parse(data?.tool_auth)[3]?.password;
    data.email_4 = JSON.parse(data?.tool_auth)[4]?.email;
    data.password_4 = JSON.parse(data?.tool_auth)[4]?.password;
    data.email_5 = JSON.parse(data?.tool_auth)[5]?.email;
    data.password_5 = JSON.parse(data?.tool_auth)[5]?.password;
    data.email_6 = JSON.parse(data?.tool_auth)[6]?.email;
    data.password_6 = JSON.parse(data?.tool_auth)[6]?.password;
    data.email_7 = JSON.parse(data?.tool_auth)[7]?.email;
    data.password_7 = JSON.parse(data?.tool_auth)[7]?.password;
    data.email_8 = JSON.parse(data?.tool_auth)[8]?.email;
    data.password_8 = JSON.parse(data?.tool_auth)[8]?.password;
    data.email_9 = JSON.parse(data?.tool_auth)[9]?.email;
    data.password_9 = JSON.parse(data?.tool_auth)[9]?.password;
    data.email_10 = JSON.parse(data?.tool_auth)[10]?.email;
    data.password_10 = JSON.parse(data?.tool_auth)[10]?.password;

    // Handle additional device settings - ensure they exist with defaults for old tools
    data.additional_device_price = data.additional_device_price || "5";
    data.max_devices = data.max_devices || 11;

    return data;
  };

  return (
    <Formik
      enableReinitialize={true}
      initialValues={
        mode == "edit"
          ? data
            ? patchCookiesData(data)
            : initialValues
          : initialValues
      }
      onSubmit={onSubmit}
      validationSchema={goalsSchema}
    >
      {({
        values,
        handleChange,
        setFieldValue,
        handleBlur,
        touched,
        handleSubmit,
        errors,
      }) => (
        <form onSubmit={handleSubmit} className="flex">
          <div className="p-6.5 w-full">
            {mode === "edit" && isDataLoading && (
              <p className="mb-6.5 p-4 py-2 rounded-md w-min whitespace-pre bg-red font-bold text-white">
                {t('toolsForm.previousDataLoading')}
              </p>
            )}
            <InputField
              className={"w-full mb-4.5"}
              required={true}
              id={"tool_name"}
              label={t('toolsForm.toolName')}
              type={"text"}
              placeholder={t('toolsForm.enterToolName')}
              value={values.tool_name}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched.tool_name && errors.tool_name}
            />
            <InputField
              className={"w-full mb-4.5"}
              required={true}
              id={"tool_category"}
              label={t('toolsForm.toolCategory')}
              type={"text"}
              placeholder={t('toolsForm.enterToolCategory')}
              value={values.tool_category}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched.tool_category && errors.tool_category}
            />
            
            <FormikRadioGroup
              picked={values.tool_plan}
              options={PLANS_OPTIONS}
              id={"tool_plan"}
              label={t('toolsForm.toolPlan')}
              name={"tool_plan"}
            />
            {touched.tool_plan && errors.tool_plan ? (
              <p className="text-red pb-5 text-md">
                {errors.tool_plan.toString()}
              </p>
            ) : null}
            <InputField
              className={"w-full mb-4.5"}
              required={true}
              id={"tool_login_url"}
              label={t('toolsForm.loginUrl')}
              type={"text"}
              placeholder={t('toolsForm.enterLoginUrl')}
              value={values.tool_login_url}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched.tool_login_url && errors.tool_login_url}
            />
            <InputField
              className={"w-full mb-4.5"}
              required={true}
              id={"tool_url"}
              label={t('toolsForm.dashboardUrl')}
              type={"text"}
              placeholder={t('toolsForm.enterDashboardUrl')}
              value={values.tool_url}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched.tool_url && errors.tool_url}
            />
            <InputField
              className={"w-full mb-4.5"}
              required={true}
              id={"tool_image"}
              label={t('toolsForm.toolImage')}
              type={"text"}
              placeholder={t('toolsForm.enterToolImage')}
              value={values.tool_image}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched.tool_image && errors.tool_image}
            />
            <InputField
              className={"w-full mb-4.5"}
              id={"tool_day_price"}
              label={t('toolsForm.toolDayPrice')}
              type={"number"}
              placeholder={t('toolsForm.enterToolDayPrice')}
              value={values.tool_day_price}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched.tool_day_price && errors.tool_day_price}
            />
            <InputField
              className={"w-full mb-4.5"}
              required={true}
              id={"tool_month_price"}
              label={t('toolsForm.toolMonthPrice')}
              type={"number"}
              placeholder={t('toolsForm.enterToolMonthPrice')}
              value={values.tool_month_price}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched.tool_month_price && errors.tool_month_price}
            />
            <InputField
              className={"w-full mb-4.5"}
              required={true}
              id={"tool_year_price"}
              label={t('toolsForm.toolYearPrice')}
              type={"number"}
              placeholder={t('toolsForm.enterToolYearPrice')}
              value={values.tool_year_price}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched.tool_year_price && errors.tool_year_price}
            />
            <InputField
              className={"w-full mb-4.5"}
              required={true}
              id={"tool_none_price_month"}
              label={t('toolsForm.toolNonePriceMonth')}
              type={"number"}
              placeholder={t('toolsForm.enterToolNonePriceMonth')}
              value={values.tool_none_price_month}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched.tool_none_price_month && errors.tool_none_price_month}
            />
            <InputField
              className={"w-full mb-4.5"}
              required={true}
              id={"tool_none_price_year"}
              label={t('toolsForm.toolNonePriceYear')}
              type={"number"}
              placeholder={t('toolsForm.enterToolNonePriceYear')}
              value={values.tool_none_price_year}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched.tool_none_price_year && errors.tool_none_price_year}
            />
            
         
            
            <InputField
              className={"w-full mb-4.5"}
              id={"additional_device_price"}
              name={"additional_device_price"}
              label="سعر الجهاز الإضافي ($)"
              type={"text"}
              placeholder="أدخل سعر الجهاز الإضافي"
              value={values.additional_device_price}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched.additional_device_price && errors.additional_device_price}
            />
            
            <InputField
              className={"w-full mb-4.5"}
              id={"max_devices"}
              name={"max_devices"}
              label="الحد الأقصى لعدد الأجهزة"
              type={"number"}
              placeholder="Enter max devices (e.g., 11 = 1 main + 10 additional)"
              value={values.max_devices}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched.max_devices && errors.max_devices}
            />
            
            <Textarea
              rows={2}
              className={"w-full mb-4.5"}
              required={true}
              id={"tool_content"}
              label={t('toolsForm.toolContent')}
              placeholder={t('toolsForm.enterToolContent')}
              value={values.tool_content}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched.tool_content && errors.tool_content}
            />
            <ReactQuill
              className={"w-full mb-4.5  bg-white"}
              id={"tool_description"}
              placeholder={t('toolsForm.enterToolDescription')}
              theme="snow"
              value={values.tool_description}
              onChange={(event) => {
                setFieldValue("tool_description", event);
              }}
            />
            {touched.tool_description && errors.tool_description ? (
              <p className="text-red pb-5 text-md">
                {errors.tool_description.toString()}
              </p>
            ) : null}
            <FormikRadioGroup
              picked={values.tool_mode}
              options={TOOL_MODE_OPTIONS}
              id={"tool_mode"}
              label={t('toolsForm.toolMode')}
              name={"tool_mode"}
            />
            {touched.tool_mode && errors.tool_mode ? (
              <p className="text-red pb-5 text-md">
                {errors.tool_mode.toString()}
              </p>
            ) : null}

            <div className="flex flex-col gap-3">
              <FormikCheckboxItem
                label={t('toolsForm.canOpenLink')}
                id="isLink"
                name="isLink"
                value={values.isLink}
              />
              <FormikCheckboxItem
                label={t('toolsForm.isActive')}
                id="isActive"
                name="isActive"
                value={values.isActive}
              />
              <FormikCheckboxItem
                label={t('toolsForm.isStable')}
                id="isStable"
                name="isStable"
                value={values.isStable}
              />
            </div>

            <Button
              type={"submit"}
              style={{ marginTop: "17px" }}
              disabled={isCreating || isPatching}
              isLoading={isCreating || isPatching}
              formNoValidate={true}
              loadingText={mode === "edit" ? t('toolsForm.updating') : t('toolsForm.creating')}
            >
              {mode === "edit" ? t('toolsForm.updateTool') : t('toolsForm.createTool')}
            </Button>
            <p className="py-[50px]"></p>
            <InputField
              className={"w-full mb-4.5"}
              id={"blocked_url_1"}
              label={"Blocked Url 1"}
              type={"text"}
              placeholder={"Enter Blocked Url 1"}
              value={values.blocked_url_1}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched.blocked_url_1 && errors.blocked_url_1}
            />
            <InputField
              className={"w-full mb-4.5"}
              id={"blocked_url_2"}
              label={"Blocked Url 2"}
              type={"text"}
              placeholder={"Enter Blocked Url 2"}
              value={values.blocked_url_2}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched.blocked_url_2 && errors.blocked_url_2}
            />
            <InputField
              className={"w-full mb-4.5"}
              id={"blocked_url_3"}
              label={"Blocked Url 3"}
              type={"text"}
              placeholder={"Enter Blocked Url 3"}
              value={values.blocked_url_3}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched.blocked_url_3 && errors.blocked_url_3}
            />
            <InputField
              className={"w-full mb-4.5"}
              id={"blocked_url_4"}
              label={"Blocked Url 4"}
              type={"text"}
              placeholder={"Enter Blocked Url 4"}
              value={values.blocked_url_4}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched.blocked_url_4 && errors.blocked_url_4}
            />
            <InputField
              className={"w-full mb-4.5"}
              id={"blocked_url_5"}
              label={"Blocked Url 5"}
              type={"text"}
              placeholder={"Enter Blocked Url 5"}
              value={values.blocked_url_5}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched.blocked_url_5 && errors.blocked_url_5}
            />
            <InputField
              className={"w-full mb-4.5"}
              id={"blocked_url_6"}
              label={"Blocked Url 6"}
              type={"text"}
              placeholder={"Enter Blocked Url 6"}
              value={values.blocked_url_6}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched.blocked_url_6 && errors.blocked_url_6}
            />
            <InputField
              className={"w-full mb-4.5"}
              id={"blocked_url_7"}
              label={"Blocked Url 7"}
              type={"text"}
              placeholder={"Enter Blocked Url 7"}
              value={values.blocked_url_7}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched.blocked_url_7 && errors.blocked_url_7}
            />
            <InputField
              className={"w-full mb-4.5"}
              id={"blocked_url_8"}
              label={"Blocked Url 8"}
              type={"text"}
              placeholder={"Enter Blocked Url 8"}
              value={values.blocked_url_8}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched.blocked_url_8 && errors.blocked_url_8}
            />
            <InputField
              className={"w-full mb-4.5"}
              id={"blocked_url_9"}
              label={"Blocked Url 9"}
              type={"text"}
              placeholder={"Enter Blocked Url 9"}
              value={values.blocked_url_9}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched.blocked_url_9 && errors.blocked_url_9}
            />
            <InputField
              className={"w-full mb-4.5"}
              id={"blocked_url_10"}
              label={"Blocked Url 10"}
              type={"text"}
              placeholder={"Enter Blocked Url 10"}
              value={values.blocked_url_10}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched.blocked_url_10 && errors.blocked_url_10}
            />

            <div className="py-10"></div>

            {/* blocked elements */}

            <InputField
              className={"w-full mb-4.5"}
              id={"blocked_element_1"}
              label={"Blocked Element 1"}
              type={"text"}
              placeholder={"Enter Blocked Element 1"}
              value={values.blocked_element_1}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched.blocked_element_1 && errors.blocked_element_1}
            />
            <InputField
              className={"w-full mb-4.5"}
              id={"blocked_element_2"}
              label={"Blocked Element 2"}
              type={"text"}
              placeholder={"Enter Blocked Element 2"}
              value={values.blocked_element_2}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched.blocked_element_2 && errors.blocked_element_2}
            />
            <InputField
              className={"w-full mb-4.5"}
              id={"blocked_element_3"}
              label={"Blocked Element 3"}
              type={"text"}
              placeholder={"Enter Blocked Element 3"}
              value={values.blocked_element_3}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched.blocked_element_3 && errors.blocked_element_3}
            />
            <InputField
              className={"w-full mb-4.5"}
              id={"blocked_element_4"}
              label={"Blocked Element 4"}
              type={"text"}
              placeholder={"Enter Blocked Element 4"}
              value={values.blocked_element_4}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched.blocked_element_4 && errors.blocked_element_4}
            />
            <InputField
              className={"w-full mb-4.5"}
              id={"blocked_element_5"}
              label={"Blocked Element 5"}
              type={"text"}
              placeholder={"Enter Blocked Element 5"}
              value={values.blocked_element_5}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched.blocked_element_5 && errors.blocked_element_5}
            />
            <InputField
              className={"w-full mb-4.5"}
              id={"blocked_element_6"}
              label={"Blocked Element 6"}
              type={"text"}
              placeholder={"Enter Blocked Element 6"}
              value={values.blocked_element_6}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched.blocked_element_6 && errors.blocked_element_6}
            />
            <InputField
              className={"w-full mb-4.5"}
              id={"blocked_element_7"}
              label={"Blocked Element 7"}
              type={"text"}
              placeholder={"Enter Blocked Element 7"}
              value={values.blocked_element_7}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched.blocked_element_7 && errors.blocked_element_7}
            />
            <InputField
              className={"w-full mb-4.5"}
              id={"blocked_element_8"}
              label={"Blocked Element 8"}
              type={"text"}
              placeholder={"Enter Blocked Element 8"}
              value={values.blocked_element_8}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched.blocked_element_8 && errors.blocked_element_8}
            />
            <InputField
              className={"w-full mb-4.5"}
              id={"blocked_element_9"}
              label={"Blocked Element 9"}
              type={"text"}
              placeholder={"Enter Blocked Element 9"}
              value={values.blocked_element_9}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched.blocked_element_9 && errors.blocked_element_9}
            />
            <InputField
              className={"w-full mb-4.5"}
              id={"blocked_element_10"}
              label={"Blocked Element 10"}
              type={"text"}
              placeholder={"Enter Blocked Element 10"}
              value={values.blocked_element_10}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched.blocked_element_10 && errors.blocked_element_10}
            />

            <div className="py-10"></div>

            {/* external links */}

            <InputField
              className={"w-full mb-4.5"}
              id={"external_link_1"}
              label={"External Link 1"}
              type={"text"}
              placeholder={"Enter External Link 1"}
              value={values.external_link_1}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched.external_link_1 && errors.external_link_1}
            />
            <InputField
              className={"w-full mb-4.5"}
              id={"external_link_2"}
              label={"External Link 2"}
              type={"text"}
              placeholder={"Enter External Link 2"}
              value={values.external_link_2}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched.external_link_2 && errors.external_link_2}
            />
            <InputField
              className={"w-full mb-4.5"}
              id={"external_link_3"}
              label={"External Link 3"}
              type={"text"}
              placeholder={"Enter External Link 3"}
              value={values.external_link_3}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched.external_link_3 && errors.external_link_3}
            />
            <InputField
              className={"w-full mb-4.5"}
              id={"external_link_4"}
              label={"External Link 4"}
              type={"text"}
              placeholder={"Enter External Link 4"}
              value={values.external_link_4}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched.external_link_4 && errors.external_link_4}
            />
            <InputField
              className={"w-full mb-4.5"}
              id={"external_link_5"}
              label={"External Link 5"}
              type={"text"}
              placeholder={"Enter External Link 5"}
              value={values.external_link_5}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched.external_link_5 && errors.external_link_5}
            />
            <InputField
              className={"w-full mb-4.5"}
              id={"external_link_6"}
              label={"External Link 6"}
              type={"text"}
              placeholder={"Enter External Link 6"}
              value={values.external_link_6}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched.external_link_6 && errors.external_link_6}
            />
            <InputField
              className={"w-full mb-4.5"}
              id={"external_link_7"}
              label={"External Link 7"}
              type={"text"}
              placeholder={"Enter External Link 7"}
              value={values.external_link_7}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched.external_link_7 && errors.external_link_7}
            />
            <InputField
              className={"w-full mb-4.5"}
              id={"external_link_8"}
              label={"External Link 8"}
              type={"text"}
              placeholder={"Enter External Link 8"}
              value={values.external_link_8}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched.external_link_8 && errors.external_link_8}
            />
            <InputField
              className={"w-full mb-4.5"}
              id={"external_link_9"}
              label={"External Link 9"}
              type={"text"}
              placeholder={"Enter External Link 9"}
              value={values.external_link_9}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched.external_link_9 && errors.external_link_9}
            />
            <InputField
              className={"w-full mb-4.5"}
              id={"external_link_10"}
              label={"External Link 10"}
              type={"text"}
              placeholder={"Enter External Link 10"}
              value={values.external_link_10}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched.external_link_10 && errors.external_link_10}
            />
          </div>
          <div className="w-full p-6.5">
            {/* Local Storage Input 1 */}
            <Textarea
              rows={5}
              className={"w-full mb-4.5"}
              id={"local_storage_1"}
              label={"Local Storage 1"}
              placeholder={"Enter Local Storage 1"}
              value={values.local_storage_1}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched.local_storage_1 && errors.local_storage_1}
            />
            {isLocalStorageError && (
              <p className="w-full text-red text-center">
                Provide at least one local storage data or enter []
              </p>
            )}
            {/* Cookie Input 1 */}
            <Textarea
              rows={3}
              className={"w-full mb-4.5 mt-8"}
              id={"cookie_1"}
              label={"Cookie 1"}
              placeholder={"Enter Cookie 1"}
              value={values.cookie_1}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched.cookie_1 && errors.cookie_1}
            />
            {isCookiesError && (
              <p className="w-full text-red text-center">
                Provide at least one cookie or enter []
              </p>
            )}
            {/* Cookie Input 2 */}
            <Textarea
              rows={3}
              className={"w-full mb-4.5"}
              id={"cookie_2"}
              label={"Cookie 2"}
              placeholder={"Enter Cookie 2"}
              value={values.cookie_2}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched.cookie_2 && errors.cookie_2}
            />

            {/* Cookie Input 3 */}
            <Textarea
              rows={3}
              className={"w-full mb-4.5"}
              id={"cookie_3"}
              label={"Cookie 3"}
              placeholder={"Enter Cookie 3"}
              value={values.cookie_3}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched.cookie_3 && errors.cookie_3}
            />

            {/* Cookie Input 4 */}
            <Textarea
              rows={3}
              className={"w-full mb-4.5"}
              id={"cookie_4"}
              label={"Cookie 4"}
              placeholder={"Enter Cookie 4"}
              value={values.cookie_4}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched.cookie_4 && errors.cookie_4}
            />

            {/* Cookie Input 5 */}
            <Textarea
              rows={3}
              className={"w-full mb-4.5"}
              id={"cookie_5"}
              label={"Cookie 5"}
              placeholder={"Enter Cookie 5"}
              value={values.cookie_5}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched.cookie_5 && errors.cookie_5}
            />

            {/* Cookie Input 6 */}
            <Textarea
              rows={3}
              className={"w-full mb-4.5"}
              id={"cookie_6"}
              label={"Cookie 6"}
              placeholder={"Enter Cookie 6"}
              value={values.cookie_6}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched.cookie_6 && errors.cookie_6}
            />

            {/* Cookie Input 7 */}
            <Textarea
              rows={3}
              className={"w-full mb-4.5"}
              id={"cookie_7"}
              label={"Cookie 7"}
              placeholder={"Enter Cookie 7"}
              value={values.cookie_7}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched.cookie_7 && errors.cookie_7}
            />

            {/* Cookie Input 8 */}
            <Textarea
              rows={3}
              className={"w-full mb-4.5"}
              id={"cookie_8"}
              label={"Cookie 8"}
              placeholder={"Enter Cookie 8"}
              value={values.cookie_8}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched.cookie_8 && errors.cookie_8}
            />

            {/* Cookie Input 9 */}
            <Textarea
              rows={3}
              className={"w-full mb-4.5"}
              id={"cookie_9"}
              label={"Cookie 9"}
              placeholder={"Enter Cookie 9"}
              value={values.cookie_9}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched.cookie_9 && errors.cookie_9}
            />

            {/* Cookie Input 10 */}
            <Textarea
              rows={3}
              className={"w-full mb-4.5"}
              id={"cookie_10"}
              label={"Cookie 10"}
              placeholder={"Enter Cookie 10"}
              value={values.cookie_10}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched.cookie_10 && errors.cookie_10}
            />

            {/* Cookie Input 11 */}
            <Textarea
              rows={3}
              className={"w-full mb-4.5"}
              id={"cookie_11"}
              label={"Cookie 11"}
              placeholder={"Enter Cookie 11"}
              value={values.cookie_11}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched.cookie_11 && errors.cookie_11}
            />

            {/* Cookie Input 12 */}
            <Textarea
              rows={3}
              className={"w-full mb-4.5"}
              id={"cookie_12"}
              label={"Cookie 12"}
              placeholder={"Enter Cookie 12"}
              value={values.cookie_12}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched.cookie_12 && errors.cookie_12}
            />

            {/* Cookie Input 13 */}
            <Textarea
              rows={3}
              className={"w-full mb-4.5"}
              id={"cookie_13"}
              label={"Cookie 13"}
              placeholder={"Enter Cookie 13"}
              value={values.cookie_13}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched.cookie_13 && errors.cookie_13}
            />

            {/* Cookie Input 14 */}
            <Textarea
              rows={3}
              className={"w-full mb-4.5"}
              id={"cookie_14"}
              label={"Cookie 14"}
              placeholder={"Enter Cookie 14"}
              value={values.cookie_14}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched.cookie_14 && errors.cookie_14}
            />

            {/* Cookie Input 15 */}
            <Textarea
              rows={3}
              className={"w-full mb-4.5"}
              id={"cookie_15"}
              label={"Cookie 15"}
              placeholder={"Enter Cookie 15"}
              value={values.cookie_15}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched.cookie_15 && errors.cookie_15}
            />

            {/* Cookie Input 16 */}
            <Textarea
              rows={3}
              className={"w-full mb-4.5"}
              id={"cookie_16"}
              label={"Cookie 16"}
              placeholder={"Enter Cookie 16"}
              value={values.cookie_16}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched.cookie_16 && errors.cookie_16}
            />

            {/* Cookie Input 17 */}
            <Textarea
              rows={3}
              className={"w-full mb-4.5"}
              id={"cookie_17"}
              label={"Cookie 17"}
              placeholder={"Enter Cookie 17"}
              value={values.cookie_17}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched.cookie_17 && errors.cookie_17}
            />

            {/* Cookie Input 18 */}
            <Textarea
              rows={3}
              className={"w-full mb-4.5"}
              id={"cookie_18"}
              label={"Cookie 18"}
              placeholder={"Enter Cookie 18"}
              value={values.cookie_18}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched.cookie_18 && errors.cookie_18}
            />

            {/* Cookie Input 19 */}
            <Textarea
              rows={3}
              className={"w-full mb-4.5"}
              id={"cookie_19"}
              label={"Cookie 19"}
              placeholder={"Enter Cookie 19"}
              value={values.cookie_19}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched.cookie_19 && errors.cookie_19}
            />

            {/* Cookie Input 20 */}
            <Textarea
              rows={3}
              className={"w-full mb-4.5"}
              id={"cookie_20"}
              label={"Cookie 20"}
              placeholder={"Enter Cookie 20"}
              value={values.cookie_20}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched.cookie_20 && errors.cookie_20}
            />

            {/* Path */}
            <div className="p-4 rounded-md border-[3px] border-[#A020F0] mb-6">
              <div className="flex gap-6">
                <InputField
                  className={"w-full mb-4.5"}
                  id={"email_path"}
                  label={"Email path"}
                  type={"text"}
                  placeholder={"Enter email path"}
                  value={values.email_path}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={touched.email_path && errors.email_path}
                />
                <InputField
                  className={"w-full mb-4.5"}
                  id={"password_path"}
                  label={"Password path"}
                  type={"text"}
                  placeholder={"Enter password path"}
                  value={values.password_path}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={touched.password_path && errors.password_path}
                />
              </div>
              <InputField
                className={"w-full mb-4.5"}
                id={"button_path"}
                label={"Button path"}
                type={"text"}
                placeholder={"Enter button path"}
                value={values.button_path}
                onChange={handleChange}
                onBlur={handleBlur}
                error={touched.button_path && errors.button_path}
              />
            </div>

            {/* Auths */}
            <div className="p-4 rounded-md border-[3px] border-[#A020F0] mb-6">
              {/* Set 1 */}
              <div className="flex gap-6">
                <InputField
                  className={"w-full mb-4.5"}
                  id={"email_1"}
                  label={"Email 1"}
                  type={"text"}
                  placeholder={"Enter email 1"}
                  value={values.email_1}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={touched.email_1 && errors.email_1}
                />
                <InputField
                  className={"w-full mb-4.5"}
                  id={"password_1"}
                  label={"Password 1"}
                  type={"text"}
                  placeholder={"Enter password 1"}
                  value={values.password_1}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={touched.password_1 && errors.password_1}
                />
              </div>

              {/* Set 2 */}
              <div className="flex gap-6">
                <InputField
                  className={"w-full mb-4.5"}
                  id={"email_2"}
                  label={"Email 2"}
                  type={"text"}
                  placeholder={"Enter email 2"}
                  value={values.email_2}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={touched.email_2 && errors.email_2}
                />
                <InputField
                  className={"w-full mb-4.5"}
                  id={"password_2"}
                  label={"Password 2"}
                  type={"text"}
                  placeholder={"Enter password 2"}
                  value={values.password_2}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={touched.password_2 && errors.password_2}
                />
              </div>

              {/* Set 3 */}
              <div className="flex gap-6">
                <InputField
                  className={"w-full mb-4.5"}
                  id={"email_3"}
                  label={"Email 3"}
                  type={"text"}
                  placeholder={"Enter email 3"}
                  value={values.email_3}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={touched.email_3 && errors.email_3}
                />
                <InputField
                  className={"w-full mb-4.5"}
                  id={"password_3"}
                  label={"Password 3"}
                  type={"text"}
                  placeholder={"Enter password 3"}
                  value={values.password_3}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={touched.password_3 && errors.password_3}
                />
              </div>

              {/* Set 4 */}
              <div className="flex gap-6">
                <InputField
                  className={"w-full mb-4.5"}
                  id={"email_4"}
                  label={"Email 4"}
                  type={"text"}
                  placeholder={"Enter email 4"}
                  value={values.email_4}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={touched.email_4 && errors.email_4}
                />
                <InputField
                  className={"w-full mb-4.5"}
                  id={"password_4"}
                  label={"Password 4"}
                  type={"text"}
                  placeholder={"Enter password 4"}
                  value={values.password_4}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={touched.password_4 && errors.password_4}
                />
              </div>

              {/* Set 5 */}
              <div className="flex gap-6">
                <InputField
                  className={"w-full mb-4.5"}
                  id={"email_5"}
                  label={"Email 5"}
                  type={"text"}
                  placeholder={"Enter email 5"}
                  value={values.email_5}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={touched.email_5 && errors.email_5}
                />
                <InputField
                  className={"w-full mb-4.5"}
                  id={"password_5"}
                  label={"Password 5"}
                  type={"text"}
                  placeholder={"Enter password 5"}
                  value={values.password_5}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={touched.password_5 && errors.password_5}
                />
              </div>

              {/* Set 6 */}
              <div className="flex gap-6">
                <InputField
                  className={"w-full mb-4.5"}
                  id={"email_6"}
                  label={"Email 6"}
                  type={"text"}
                  placeholder={"Enter email 6"}
                  value={values.email_6}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={touched.email_6 && errors.email_6}
                />
                <InputField
                  className={"w-full mb-4.5"}
                  id={"password_6"}
                  label={"Password 6"}
                  type={"text"}
                  placeholder={"Enter password 6"}
                  value={values.password_6}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={touched.password_6 && errors.password_6}
                />
              </div>

              {/* Set 7 */}
              <div className="flex gap-6">
                <InputField
                  className={"w-full mb-4.5"}
                  id={"email_7"}
                  label={"Email 7"}
                  type={"text"}
                  placeholder={"Enter email 7"}
                  value={values.email_7}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={touched.email_7 && errors.email_7}
                />
                <InputField
                  className={"w-full mb-4.5"}
                  id={"password_7"}
                  label={"Password 7"}
                  type={"text"}
                  placeholder={"Enter password 7"}
                  value={values.password_7}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={touched.password_7 && errors.password_7}
                />
              </div>

              {/* Set 8 */}
              <div className="flex gap-6">
                <InputField
                  className={"w-full mb-4.5"}
                  id={"email_8"}
                  label={"Email 8"}
                  type={"text"}
                  placeholder={"Enter email 8"}
                  value={values.email_8}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={touched.email_8 && errors.email_8}
                />
                <InputField
                  className={"w-full mb-4.5"}
                  id={"password_8"}
                  label={"Password 8"}
                  type={"text"}
                  placeholder={"Enter password 8"}
                  value={values.password_8}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={touched.password_8 && errors.password_8}
                />
              </div>

              {/* Set 9 */}
              <div className="flex gap-6">
                <InputField
                  className={"w-full mb-4.5"}
                  id={"email_9"}
                  label={"Email 9"}
                  type={"text"}
                  placeholder={"Enter email 9"}
                  value={values.email_9}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={touched.email_9 && errors.email_9}
                />
                <InputField
                  className={"w-full mb-4.5"}
                  id={"password_9"}
                  label={"Password 9"}
                  type={"text"}
                  placeholder={"Enter password 9"}
                  value={values.password_9}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={touched.password_9 && errors.password_9}
                />
              </div>

              {/* Set 10 */}
              <div className="flex gap-6">
                <InputField
                  className={"w-full mb-4.5"}
                  id={"email_10"}
                  label={"Email 10"}
                  type={"text"}
                  placeholder={"Enter email 10"}
                  value={values.email_10}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={touched.email_10 && errors.email_10}
                />
                <InputField
                  className={"w-full mb-4.5"}
                  id={"password_10"}
                  label={"Password 10"}
                  type={"text"}
                  placeholder={"Enter password 10"}
                  value={values.password_10}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={touched.password_10 && errors.password_10}
                />
              </div>
            </div>
          </div>
        </form>
      )}
    </Formik>
  );
};

export default ToolsForm;
