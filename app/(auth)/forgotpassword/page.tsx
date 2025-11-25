"use client";
import { useState } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import LoadingButton from "@/components/LoadingButton";
import UseForgetPassword from "@/hooks/useForgetPassword";
import Link from "next/link";
import { Mail } from "lucide-react";

const SignIn: React.FC = () => {
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const initialForgetAlertState: [string, string] = ["", ""];
  const [forgetAlertState, setForgetAlertState] = useState<[string, string]>(
    initialForgetAlertState
  );

  const requiredMessage = "This field is required.";

  const forgetFormik = useFormik({
    initialValues: {
      email: "",
    },
    validationSchema: Yup.object({
      email: Yup.string().required(requiredMessage),
    }),
    onSubmit: (values) => {
      UseForgetPassword(values, setIsLoading, setForgetAlertState);
    },
  });

  return (
    <div dir="ltr" className="w-full h-full flex bg-white auth-container relative">
      <img src="/images/anime-top (2).png" className="absolute max-w-[180px] opacity-70 blur-[1px]" />
      <img src="/images/anime-bottom (2).png" className="absolute bottom-0 left-1/3 ml-20 max-w-[170px] opacity-70 blur-[1px]" />
      <div className="h-full flex flex-col justify-center items-center w-full lg:w-1/2 px-[20px]">
        <div className="w-full flex justify-center p-10">
          <img src="/images/nexus-logo-2.png" className="max-w-[250px]" />
        </div>
        <div className="w-full mb-[80px] py-[50px] max-w-[450px] p-[30px] bg-[linear-gradient(180deg,_#00c48c,_#4f008c)] rounded-[37px] border-[1px] border-white">
          <form
            className="space-y-5 pt-5"
            noValidate
            onSubmit={forgetFormik.handleSubmit}
          >
            <div className="text-center text-white text-[25px] font-bold">
              Forgot your password?
            </div>
            <div className="text-center font-bold text-white">
              Please enter the email associated with your account to change your password
            </div>
            <div className="relative">
              <input
                type="email"
                name="email"
                id="email"
                className="border-[#FFA500] placeholder-[#afafaf]  border-2 border-orange-400 text-white bg-[#1a0b2e] px-4 py-[14px] text-md font-bold rounded-xl focus:ring-[#FFA500] focus:border-[#FFA500] block w-full"
                placeholder="Enter email address"
                onChange={forgetFormik.handleChange}
                onBlur={forgetFormik.handleBlur}
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <Mail className="h-5 w-5 text-white" />
              </div>
              {forgetFormik.touched.email && forgetFormik.errors.email ? (
                <p className="text-[#DC2626] text-[13px] font-bold">{forgetFormik.errors.email}</p>
              ) : null}
            </div>
            <div className="w-full px-9 flex items-center justify-center">
              <LoadingButton
                className="bg-[#ff7702] hover:bg-[#1E429F] w-2/3 h-[40px] text-white font-bold py-5 rounded-xl flex items-center justify-center gap-2 border-white border"
                isDisabled={isLoading}
                // title="Send Reset Link"
                isLoading={isLoading}
                onClick={() => { }}
              >
              Send Reset Link
              </LoadingButton>
            </div>
            {forgetAlertState[0] != "" && (
              <p
                style={{ color: forgetAlertState[1] }}
                className="w-full p-0 m-0 font-semibold text-center text-sm text-red"
              >
                {forgetAlertState[0]}
              </p>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default SignIn;
