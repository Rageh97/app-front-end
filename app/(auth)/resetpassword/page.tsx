"use client";
import { useState } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import LoadingButton from "@/components/LoadingButton";
import UseResetPassword from "@/hooks/useResetPassword";
import { useSearchParams } from 'next/navigation'
import { CalendarCheck, Eye } from "lucide-react";

const SignIn: React.FC = () => {
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const initialForgetAlertState: [string, string] = ["", ""];
  const [forgetAlertState, setForgetAlertState] = useState<[string, string]>(
    initialForgetAlertState
  );

  const searchParams = useSearchParams()

  const requiredMessage = "This field is required.";

  const forgetFormik = useFormik({
    initialValues: {
      password: "",
      r_password: ""
    },
    validationSchema: Yup.object({
      password: Yup.string().required(requiredMessage),
      r_password: Yup.string().required(requiredMessage),
    }),
    onSubmit: (values) => {
      UseResetPassword({
        token: searchParams.get('token'),
        password: values.password,
        confirm_password: values.r_password,
      }, setIsLoading, setForgetAlertState);
    },
  });

  return (
    <div dir="ltr" className="w-full h-full flex bg-white auth-container relative">
      <img src="/images/anime-top (2).png" className="absolute max-w-[180px] opacity-70 blur-[1px]" />
      <img src="/images/anime-bottom (2).png" className="absolute bottom-0 left-1/3 ml-20 max-w-[170px] opacity-70 blur-[1px]" />
      <div className="h-full flex justify-center items-center w-full lg:w-1/2 px-[20px]">
        <div className="w-full py-[50px] max-w-[450px] p-[30px] bg-[linear-gradient(180deg,_#00c48c,_#4f008c)] rounded-[37px] border-[1px] border-white">
          <form
            className="space-y-5 pt-5"
            noValidate
            onSubmit={forgetFormik.handleSubmit}
          >
            <div className="text-center text-white text-[25px] pb-4 font-bold">
              Reset your password
            </div>
            <div className="relative">
              <input
                type="password"
                name="password"
                id="password"
                className="border-[#FFA500] placeholder-[#afafaf]  border-2 border-orange-400 text-white bg-[#1a0b2e] px-4 py-[14px] text-md font-bold rounded-xl focus:ring-[#FFA500] focus:border-[#FFA500] block w-full"
                placeholder="Enter new password"
                onChange={forgetFormik.handleChange}
                onBlur={forgetFormik.handleBlur}
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <Eye className="h-5 w-5 text-white" />
              </div>

              {forgetFormik.touched.password && forgetFormik.errors.password ? (
                <p className="text-[#DC2626] text-[13px] font-bold">{forgetFormik.errors.password}</p>
              ) : null}
            </div>
            <div className="relative">
              <input
                type="password"
                name="r_password"
                id="r_password"
                className="border-[#FFA500] placeholder-[#afafaf]  border-2 border-orange-400 text-white bg-[#1a0b2e] px-4 py-[14px] text-md font-bold rounded-xl focus:ring-[#FFA500] focus:border-[#FFA500] block w-full"
                placeholder="Confirm new password"
                onChange={forgetFormik.handleChange}
                onBlur={forgetFormik.handleBlur}
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <CalendarCheck className="h-5 w-5 text-white" />
              </div>
              {forgetFormik.touched.r_password && forgetFormik.errors.r_password ? (
                <p className="text-[#DC2626] text-[13px] font-bold">{forgetFormik.errors.r_password}</p>
              ) : null}
            </div>
            <div className="w-full px-9">
              <LoadingButton
                className="bg-[#ff7702] hover:bg-[#1E429F] w-2/3 h-[40px] text-white font-bold py-5 rounded-xl flex items-center justify-center gap-2 border-white border"
                isDisabled={isLoading}
             
                isLoading={isLoading}
                onClick={() => { }}
              >
                Reset Now
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
