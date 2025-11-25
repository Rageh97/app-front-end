import { FunctionComponent, useEffect, useState } from "react";
import LoadingButton from "../LoadingButton";
import { useFormik } from "formik";
import * as Yup from "yup";
import { usePayCihPlanProduct } from "@/utils/cih-pay/createCihProductPlanPayment";
import { NewProductPayLocalBankReqDto } from "@/types/cih/new-cih-product-pay-req-dto";
import ToolErrorModal from "../Modals/ToolErrorModal";

type Plans = "standard" | "premium" | "vip";
type bank = "cih" | "tijari";

interface PlanCihBankPaymentProps {
  plan: Plans;
  amount: number;
  bankName: bank;
  setModalOpen: Function;
}

const PlanCihBankPayment: FunctionComponent<PlanCihBankPaymentProps> = ({
  plan,
  bankName,
  amount,
  setModalOpen,
}) => {
  const [openErrorModal, setIsOpenErrorModal] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>(null);

  const {
    mutate: pay,
    isLoading: isPaying,
    isSuccess,
    isError,
  } = usePayCihPlanProduct();

  const requiredMessage = "This field is required.";

  useEffect(() => {
    if (isError) {
      setErrorMessage(
        "You already ordered the same product !!, Wait for the order to be approved or contact us to accelerate the process."
      );
      setIsOpenErrorModal(true);
    }
  }, [isError]);

  const formik = useFormik({
    initialValues: {
      user_account_name: "",
      period: "",
      plan: "standard",
      amount: 0,
    },
    validationSchema: Yup.object({
      user_account_name: Yup.string().required(requiredMessage),
    }),
    onSubmit: (values: NewProductPayLocalBankReqDto) => {
      if (plan && amount) {
        values.plan = plan;
        values.bank_name = bankName;
        values.amount = amount;
        pay(values);
      }
    },
  });

  useEffect(() => {
    if (isSuccess) {
      setModalOpen(false);
    }
  }, [isSuccess]);

  return (
    <>
      <div className="w-full h-full gap-3 flex flex-col justify-center items-center relative">
        <div
          className="px-4 py-2 text-start text-sm text-[#1E429F] absolute top-5 rounded-lg border-1 border-[#1E429F] bg-[#EBF5FF]"
          role="alert"
        >
          <span className="font-medium">Product : </span>{" "}
          {plan === "standard" ? " 1 month of Standard Plan" : null}
          {plan === "premium" ? " 1 month of Premium Plan" : null}
          {plan === "vip" ? " 1 month of Gold Plan" : null}
          <br />
          <span className="font-medium">Total : </span>{" "}
          {plan === "standard" ? amount * 10 + " MAD" : null}
          {plan === "premium" ? amount * 10 + " MAD" : null}
          {plan === "vip" ? amount * 10 + " MAD" : null}
        </div>
        <img
          src={
            bankName === "cih" ? "/images/cih-bank.png" : "/images/wafabank.png"
          }
          className="max-h-[40px]"
          alt="BANK"
        />
        <input
          type="text"
          name="user_account_name"
          id="user_account_name"
          placeholder={
            bankName === "cih"
              ? "Your CIH Bank account name"
              : "Your Attijariwafa Bank account name"
          }
          className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-[50%] p-2.5"
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
        />

        {formik.touched.user_account_name && formik.errors.user_account_name ? (
          <p className="text-danger text-sm">
            {formik.errors.user_account_name}
          </p>
        ) : null}

        <span>
          <p className="text-black text-sm">
            Make your payment directly into our bank account.
          </p>
          <p className="text-black text-sm">
            After placing an order you will see the account number.
          </p>
        </span>

        <form noValidate onSubmit={formik.handleSubmit}>
          <LoadingButton
            isDisabled={isPaying}
            title="Place Order"
            isLoading={isPaying}
            className={{ width: "auto" }}
            loadingPaddingX={28.5}
            onClick={() => {}}
          />
        </form>

        <p className="absolute text-danger text-sm bottom-5">
          *Please ensure that the name you provide matches the name on your bank
          account.
        </p>
      </div>

      <ToolErrorModal
        title="FAILED TO ORDER"
        message={errorMessage}
        modalOpen={openErrorModal}
        setModalOpen={setIsOpenErrorModal}
      />
    </>
  );
};

export default PlanCihBankPayment;
