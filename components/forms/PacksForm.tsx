'use client'

import * as Yup from "yup";
import React, { FunctionComponent, useCallback, useState, useEffect } from "react";
import { Formik, FormikHelpers } from "formik";
import InputField from "@/components/FormFields/InputField";
import Button from "@/components/buttons/Button";
import { NewPacksReqDto } from "@/types/packs/new-packs-req-dto";
import { useCreatePack } from "@/utils/pack/createPack";
import { useRouter } from "next/navigation";
import { useGetPack } from "@/utils/pack/getPack";
import { useUpdatePack } from "@/utils/pack/updatePack";
import FormikCheckboxItem from "../FormFields/FormikCheckboxItem";
import { useMyInfo } from "@/utils/user-info/getUserInfo";
import { useTranslation } from "react-i18next";
import { useMemo } from "react";

type FormType = NewPacksReqDto & {
  monthly_price: number;
  yearly_price: number;
  credit_plan_id?: number;
  monthly_credit_plan_id?: number;
  yearly_credit_plan_id?: number;
  media_downloads_limit: number;
  media_downloads_limit_yearly: number;
  daily_downloads_limit: number;
  // Font limits
  font_downloads_limit: number;
  font_downloads_limit_yearly: number;
  daily_font_downloads_limit: number;
  discount_percentage: number;
};

const initialValues: FormType = {
  pack_name: "",
  pack_tools: "",
  monthly_price: 1,
  yearly_price: 12, // Default to 12x monthly price as a starting point
  additional_device_price: 1,
  max_devices: 5,
  isActive: true,
  credit_plan_id: undefined,
  monthly_credit_plan_id: undefined,
  yearly_credit_plan_id: undefined,
  media_downloads_limit: 0,
  media_downloads_limit_yearly: 0,
  daily_downloads_limit: 0,
  font_downloads_limit: 0,
  font_downloads_limit_yearly: 0,
  daily_font_downloads_limit: 0,
  discount_percentage: 0,
};

export const packsSchema: Yup.ObjectSchema<FormType> = Yup.object().shape({
  pack_id: Yup.number(),
  pack_name: Yup.string().required("Please enter pack name."),
  pack_tools: Yup.string(),
  monthly_price: Yup.number().required("Please enter monthly price.").min(1, "Price must be at least 1"),
  yearly_price: Yup.number().required("Please enter yearly price.").min(1, "Price must be at least 1"),
  additional_device_price: Yup.number().required("Please enter additional device price."),
  max_devices: Yup.number().required("Please enter max devices."),
  media_downloads_limit: Yup.number().default(0),
  media_downloads_limit_yearly: Yup.number().default(0),
  daily_downloads_limit: Yup.number().default(0),
  font_downloads_limit: Yup.number().default(0),
  font_downloads_limit_yearly: Yup.number().default(0),
  daily_font_downloads_limit: Yup.number().default(0),
  discount_percentage: Yup.number().min(0, "Discount must be 0 or more").max(100, "Discount cannot exceed 100%").default(0),
  isActive: Yup.boolean(),
  // Optional fields to match FormType
  pack_price: Yup.number().optional(),
  credit_plan_id: Yup.number().nullable().optional(),
  monthly_credit_plan_id: Yup.number().nullable().optional(),
  yearly_credit_plan_id: Yup.number().nullable().optional(),
});

type PropsType = {
  mode: string;
  packId?: number;
};

export const PacksForm: FunctionComponent<PropsType> = ({ mode, packId }) => {
  const router = useRouter();
  const { t } = useTranslation();

  const { data: userData } = useMyInfo();

  const [checkedTools, setCheckedTools] = useState<number[]>([]);
  const [isToolsError, setIsToolsError] = useState<boolean>(false);
  const [creditPlans, setCreditPlans] = useState<Array<{ plan_id: number; plan_name: string; credits_per_period: number; period: string; amount: string }>>([]);
  const [loadingCreditPlans, setLoadingCreditPlans] = useState(false);

  const apiBase = useMemo(() => process.env.NEXT_PUBLIC_API_URL, []);

  const { data: packData, isLoading: isDataLoading } = useGetPack(packId);

  const { mutate: create, isLoading: isCreating } = useCreatePack();
  const { mutate: update, isLoading: isUpdating } = useUpdatePack();

  const loadCreditPlans = async () => {
    if (!apiBase) return;
    setLoadingCreditPlans(true);
    try {
      const res = await fetch(`${apiBase}/api/credits/plans`);
      if (res.status === 200) {
        const data = await res.json();
        setCreditPlans(data);
      }
    } catch (e) {
      console.error("Error loading credit plans:", e);
    } finally {
      setLoadingCreditPlans(false);
    }
  };

  useEffect(() => {
    loadCreditPlans();
  }, [apiBase]);

  useEffect(() => {
    if (mode === "edit" && packData?.pack_tools) {
      try {
        const tools = typeof packData.pack_tools === 'string' 
          ? JSON.parse(packData.pack_tools) 
          : packData.pack_tools;
        setCheckedTools(tools || []);
      } catch (e) {
        console.error("Error parsing pack tools:", e);
        setCheckedTools([]);
      }
    }
  }, [mode, packData]);

  const onSubmit = useCallback(
    (values: FormType, { resetForm }: FormikHelpers<FormType>) => {
      console.log("onSubmit reached. Submission started...");
      console.log("Values to submit:", values);
      console.log("Checked Tools:", checkedTools);

      if (checkedTools.length === 0) {
        setIsToolsError(true)
        return
      }
      else {
        setIsToolsError(false)
      }

      const submissionValues = {
        ...values,
        pack_tools: JSON.stringify(checkedTools),
      };

      if (mode === "edit") {
        update(
          {
            ...submissionValues,
            pack_id: packId,
          },
          {
            onSuccess: () => {
              resetForm();
              router.push(`/admin/packs`);
            },
          }
        );
      } else if (mode === "new") {
        create(submissionValues, {
          onSuccess: () => {
            resetForm();
            router.push(`/admin/packs`);
          },
        });
      }
    },
    [create, update, checkedTools, mode, packId, router]
  );

  const handleCheckboxChange = (toolId: number) => {
    setCheckedTools((prevCheckedTools) =>
      prevCheckedTools.includes(toolId)
        ? prevCheckedTools.filter((id) => id !== toolId)
        : [...prevCheckedTools, toolId]
    );
  };

  const getInitialValues = (data: any): FormType => {
    if (!data) return initialValues;

    const formatted = { ...data };

    // For backward compatibility, if we have old pack_price, use it for monthly_price
    if (formatted.pack_price && !formatted.monthly_price) {
      formatted.monthly_price = formatted.pack_price;
    }
    
    // Set default yearly price if missing (10x monthly)
    if (!formatted.yearly_price) {
      formatted.yearly_price = (formatted.monthly_price || formatted.pack_price || 1) * 10;
    }

    // Ensure new fields have defaults if they don't exist in DB yet
    if (formatted.media_downloads_limit === undefined || formatted.media_downloads_limit === null) {
      formatted.media_downloads_limit = 0;
    }
    if (formatted.media_downloads_limit_yearly === undefined || formatted.media_downloads_limit_yearly === null) {
      formatted.media_downloads_limit_yearly = 0;
    }
    if (formatted.daily_downloads_limit === undefined || formatted.daily_downloads_limit === null) {
      formatted.daily_downloads_limit = 0;
    }

    if (formatted.font_downloads_limit === undefined || formatted.font_downloads_limit === null) {
      formatted.font_downloads_limit = 0;
    }
    if (formatted.font_downloads_limit_yearly === undefined || formatted.font_downloads_limit_yearly === null) {
      formatted.font_downloads_limit_yearly = 0;
    }
    if (formatted.daily_font_downloads_limit === undefined || formatted.daily_font_downloads_limit === null) {
      formatted.daily_font_downloads_limit = 0;
    }
    
    if (formatted.discount_percentage === undefined || formatted.discount_percentage === null) {
      formatted.discount_percentage = 0;
    }

    return formatted as FormType;
  }

  return (
    <Formik
      enableReinitialize={true}
      initialValues={
        mode === "edit" && packData
          ? getInitialValues(packData)
          : initialValues
      }
      onSubmit={onSubmit}
      validationSchema={packsSchema}
    >
      {({ values, handleChange, handleBlur, handleSubmit, errors, touched }) => {
        // Debugging logs
        if (Object.keys(errors).length > 0) {
          console.log("Formik Validation Errors:", errors);
        }
        
        return (
        <form onSubmit={(e) => {
          console.log("Form submit triggered");
          handleSubmit(e);
        }} className="flex">
          <div className="p-6.5 w-full">
            {
              mode === "edit" && isDataLoading ? (
                <p className="mb-6.5 p-4 py-2 rounded-md w-min whitespace-pre bg-red font-bold text-white">
                  {t('packsForm.previousDataLoading')}
                </p>
              ) : <>
                <InputField
                  className={"w-full mb-4.5"}
                  required={true}
                  id={"pack_name"}
                  label={t('packsForm.packName')}
                  type={"text"}
                  placeholder={t('packsForm.enterPackName')}
                  value={values.pack_name}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={touched.pack_name && errors.pack_name}
                />

                <div className="flex flex-wrap gap-5 rounded-md w-full border-[2px] border-black p-4 mb-4.5">
                  {userData && userData.toolsData?.map((item: any, index: number) => (
                    <div
                      onClick={() => { handleCheckboxChange(item.tool_id) }}
                      key={index}
                      className="flex border-[2px] border-black rounded-md px-2 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        className="mr-2 cursor-pointer"
                        value={item.tool_id}
                        checked={checkedTools.includes(item.tool_id)}
                        onChange={() => { }}
                      />
                      <p className="text-orange">{item.tool_name}</p>
                    </div>
                  ))}
                </div>

                {isToolsError && (
                  <p className="w-full text-start text-red mb-4.5">
                    {t('packsForm.selectOneTool')}
                  </p>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4.5">
                  <InputField
                    className={"w-full"}
                    required={true}
                    id={"monthly_price"}
                    label={t('packsForm.monthlyPrice')}
                    type={"number"}
                    min={1}
                    max={1000}
                    placeholder={"Enter monthly price"}
                    value={values.monthly_price}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={touched.monthly_price && errors.monthly_price}
                  />
                  <InputField
                    className={"w-full"}
                    required={true}
                    id={"yearly_price"}
                    label={t('packsForm.yearlyPrice')}
                    type={"number"}
                    min={1}
                    max={10000}
                    placeholder={"Enter yearly price"}
                    value={values.yearly_price}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={touched.yearly_price && errors.yearly_price}
                  />
                </div>

                <InputField
                  className={"w-full mb-4.5"}
                  required={true}
                  id={"additional_device_price"}
                  label={t('packsForm.additionalDevicePrice')}
                  type={"number"}
                  min={1}
                  max={500}
                  placeholder={t('packsForm.enterAdditionalDevicePrice')}
                  value={values.additional_device_price}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={touched.additional_device_price && errors.additional_device_price}
                />

                <InputField
                  className={"w-full mb-4.5"}
                  required={true}
                  id={"max_devices"}
                  label={t('packsForm.maxDevices')}
                  type={"number"}
                  min={1}
                  max={11}
                  placeholder={t('packsForm.enterMaxDevices')}
                  value={values.max_devices}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={touched.max_devices && errors.max_devices}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4.5">
                  <InputField
                    className={"w-full"}
                    required={true}
                    id={"media_downloads_limit"}
                    label={"Media Downloads Limit (Per Month)"}
                    type={"number"}
                    min={0}
                    max={1000}
                    placeholder={"Enter allowed downloads count"}
                    value={values.media_downloads_limit}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={touched.media_downloads_limit && errors.media_downloads_limit}
                  />
                  <InputField
                    className={"w-full"}
                    required={true}
                    id={"media_downloads_limit_yearly"}
                    label={"Media Downloads Limit (Per Year)"}
                    type={"number"}
                    min={0}
                    max={10000}
                    placeholder={"Enter allowed downloads count"}
                    value={values.media_downloads_limit_yearly}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={touched.media_downloads_limit_yearly && errors.media_downloads_limit_yearly}
                  />
                </div>

                <InputField
                  className={"w-full mb-4.5"}
                  required={false}
                  id={"daily_downloads_limit"}
                  label={"Daily Downloads Limit (0 = Unlimited)"}
                  type={"number"}
                  min={0}
                  max={100}
                  placeholder={"Enter daily limit (0 for unlimited)"}
                  value={values.daily_downloads_limit}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={touched.daily_downloads_limit && errors.daily_downloads_limit}
                />

                <div className="w-full h-px bg-white/20 my-6"></div>
                {/* <h3 className="text-xl font-bold text-white mb-4">{t('packsForm.fontsLimits') || "Font Limits"}</h3> */}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4.5">
                  <InputField
                    className={"w-full"}
                    required={true}
                    id={"font_downloads_limit"}
                    label={"Font Downloads Limit (Per Month)"}
                    type={"number"}
                    min={0}
                    max={1000}
                    placeholder={"Enter allowed font downloads"}
                    value={values.font_downloads_limit}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={touched.font_downloads_limit && errors.font_downloads_limit}
                  />
                  <InputField
                    className={"w-full"}
                    required={true}
                    id={"font_downloads_limit_yearly"}
                    label={"Font Downloads Limit (Per Year)"}
                    type={"number"}
                    min={0}
                    max={10000}
                    placeholder={"Enter allowed font downloads"}
                    value={values.font_downloads_limit_yearly}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={touched.font_downloads_limit_yearly && errors.font_downloads_limit_yearly}
                  />
                </div>

                <InputField
                  className={"w-full mb-4.5"}
                  required={false}
                  id={"daily_font_downloads_limit"}
                  label={"Daily Font Downloads Limit (0 = Unlimited)"}
                  type={"number"}
                  min={0}
                  max={100}
                  placeholder={"Enter daily limit"}
                  value={values.daily_font_downloads_limit}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={touched.daily_font_downloads_limit && errors.daily_font_downloads_limit}
                />

                <div className="w-full h-px bg-white/20 my-6"></div>

                <InputField
                  className={"w-full mb-4.5"}
                  required={false}
                  id={"discount_percentage"}
                  label={"Discount Percentage (%)"}
                  type={"number"}
                  min={0}
                  max={100}
                  placeholder={"Enter discount percentage (0-100)"}
                  value={values.discount_percentage}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={touched.discount_percentage && errors.discount_percentage}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4.5">
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      {t('packsForm.monthlyCreditPlan')}
                    </label>
                    <select
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={values.monthly_credit_plan_id || ""}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      name="monthly_credit_plan_id"
                    >
                      <option value="">{t('packsForm.noCreditPlan')}</option>
                      {loadingCreditPlans ? (
                        <option disabled>{t('packsForm.loadingCreditPlans')}</option>
                      ) : (
                        creditPlans.map((plan) => (
                          <option key={plan.plan_id} value={plan.plan_id}>
                            {plan.plan_name} - {plan.credits_per_period} {t('credits.credits')} / {plan.period} (${plan.amount})
                          </option>
                        ))
                      )}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      {t('packsForm.yearlyCreditPlan')}
                    </label>
                    <select
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={values.yearly_credit_plan_id || ""}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      name="yearly_credit_plan_id"
                    >
                      <option value="">{t('packsForm.noCreditPlan')}</option>
                      {loadingCreditPlans ? (
                        <option disabled>{t('packsForm.loadingCreditPlans')}</option>
                      ) : (
                        creditPlans.map((plan) => (
                          <option key={plan.plan_id} value={plan.plan_id}>
                            {plan.plan_name} - {plan.credits_per_period} {t('credits.credits')} / {plan.period} (${plan.amount})
                          </option>
                        ))
                      )}
                    </select>
                  </div>
                </div>

                <FormikCheckboxItem
                  label={t('packsForm.isActive')}
                  id="isActive"
                  name="isActive"
                  value={values.isActive}
                />

                <Button
                  type={"submit"}
                  style={{ marginTop: "17px" }}
                  disabled={isCreating || isUpdating}
                  isLoading={isCreating || isUpdating}
                  formNoValidate={true}
                  loadingText={mode === "edit" ? t('packsForm.updating') : t('packsForm.creating')}
                >
                  {mode === "edit" ? t('packsForm.updatePack') : t('packsForm.createPack')}
                </Button>
              </>}
          </div>
        </form>
        );
      }}
    </Formik>
  );
};

export default PacksForm;
