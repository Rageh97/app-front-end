"use client";
import { useEffect, useState } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import LoadingButton from "@/components/LoadingButton";
import UseSignUp from "@/hooks/useSignUp";
import Link from "next/link";
import { Mail, Eye, EyeOff } from "lucide-react";
const SignIn: React.FC = () => {
  const [dynamicLogoUrl, setDynamicLogoUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  
  const initialRegisterAlertState: [string, string] = ["", ""];
  const [registerAlertState, setRegisterAlertState] = useState<
  [string, string]
  >(initialRegisterAlertState);
  
  const requiredMessage = "This field is required.";
  
  const registerFormik = useFormik({
    initialValues: {
      first_name: "",
      last_name: "",
      email: "",
      password: "",
    },
    validationSchema: Yup.object({
      first_name: Yup.string().required(requiredMessage),
      last_name: Yup.string().required(requiredMessage),
      email: Yup.string().required(requiredMessage),
      password: Yup.string().required(requiredMessage),
    }),
    onSubmit: (values) => {
      UseSignUp(values, setIsLoading, setRegisterAlertState);
    },
  });
  // ...........................................
  // useEffect(() => {
  //   const fetchLogo = async () => {
  //     try {
  //       const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/settings/site_logo`);
  //       if (response.ok) {
  //         const result = await response.json();
  //         if (result.value) {
  //           setDynamicLogoUrl(`${process.env.NEXT_PUBLIC_API_URL}${result.value}`);
  //         }
  //       }
  //     } catch (error) {
  //       console.error("Failed to fetch site logo:", error);
  //     }
  //   };
    
  //   fetchLogo();
  // }, []);
  // const staticLogoPath = "/images/logoN.png";
  // const displayLogoUrl = dynamicLogoUrl || staticLogoPath;

  return (
    <div dir="ltr" className="w-full overflow-hidden flex bg-[linear-gradient(180deg,_#00c48c,_#4f008c)] auth-container relative h-full">
      <img src="/images/anime-top (2).png" className="absolute hidden lg:block max-w-[150px] opacity-70 blur-[1px] animate-rotating" />
      <img src="/images/anime-bottom (2).png" className="absolute hidden lg:block bottom-10 left-1/3 ml-20 max-w-[170px] opacity-70 blur-[1px] animate-rotating hidden lg:block" />
      <div className="h-full flex flex-col justify-center items-center w-full lg:w-1/2 px-[20px]">
        <div className="w-full flex justify-center p-4 md:p-10">
          <img src='/images/logoN.png' className="max-w-[200px]" />
        </div>
        <div className="w-full mb-[80px]  max-w-[450px] md:p-[30px] p-3 bg-[linear-gradient(180deg,_#00c48c,_#4f008c)] rounded-[37px] border-[1px] border-white">
          <form
            className="space-y-2 md:space-y-5 pt-5 "
            noValidate
            onSubmit={registerFormik.handleSubmit}
          >
            <div>
              <input
                type="text"
                name="first_name"
                id="first_name"
                className="border-[#FFA500] text-left placeholder-[#afafaf]  border-2 border-orange-400 text-white bg-[#1a0b2e] px-4 md:py-[14px] py-3 text-md font-bold rounded-xl focus:ring-[#FFA500] focus:border-[#FFA500] block w-full"
                placeholder="First name"
                onChange={registerFormik.handleChange}
                onBlur={registerFormik.handleBlur}
              />

              {registerFormik.touched.first_name &&
              registerFormik.errors.first_name ? (
                <p className="text-[#ff7702] text-[13px] font-bold">
                  {registerFormik.errors.first_name}
                </p>
              ) : null}
            </div>
            <div>
              <input
                type="text"
                name="last_name"
                id="last_name"
                placeholder="Last name"
                className="border-[#FFA500] text-left placeholder-[#afafaf]  border-2 border-orange-400 text-white bg-[#1a0b2e] px-4 md:py-[14px] py-3 text-md font-bold rounded-xl focus:ring-[#FFA500] focus:border-[#FFA500] block w-full"
                onChange={registerFormik.handleChange}
                onBlur={registerFormik.handleBlur}
              />

              {registerFormik.touched.last_name &&
              registerFormik.errors.last_name ? (
                <p className="text-[#ff7702] text-[13px] font-bold">
                  {" "}
                  {registerFormik.errors.last_name}
                </p>
              ) : null}
            </div>
            <div className="relative">
              <input
                type="email"
                name="email"
                id="email"
                placeholder="Your email"
                className="border-[#FFA500] text-left placeholder-[#afafaf]  border-2 border-orange-400 text-white bg-[#1a0b2e] px-4 md:py-[14px] py-3 text-md font-bold rounded-xl focus:ring-[#FFA500] focus:border-[#FFA500] block w-full"
                onChange={registerFormik.handleChange}
                onBlur={registerFormik.handleBlur}
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <Mail className="h-5 w-5 text-white" />
              </div>
              {registerFormik.touched.email && registerFormik.errors.email ? (
                <p className="text-[#ff7702] text-[13px] font-bold">
                  {" "}
                  {registerFormik.errors.email}
                </p>
              ) : null}
            </div>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                id="password"
                placeholder="Your password"
                className="border-[#FFA500] text-left placeholder-[#afafaf]  border-2 border-orange-400 text-white bg-[#1a0b2e] px-4 md:py-[14px] py-3 text-md font-bold rounded-xl focus:ring-[#FFA500] focus:border-[#FFA500] block w-full"
                onChange={registerFormik.handleChange}
                onBlur={registerFormik.handleBlur}
              />
              <div 
                className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5 text-white" />
                ) : (
                  <Eye className="h-5 w-5 text-white" />
                )}
              </div>
              {registerFormik.touched.password &&
              registerFormik.errors.password ? (
                <p className="text-[#ff7702] text-[13px] font-bold">
                  {" "}
                  {registerFormik.errors.password}
                </p>
              ) : null}
            </div>
            <div className="flex justify-center">
              <Link href={`/forgotpassword`} legacyBehavior>
                <a className="cursor-pointer text-center text-sm font-bold underline text-white">
                  Lost Password?
                </a>
              </Link>
            </div>
            <div className="flex justify-center text-white text-sm font-bold">
              Already registered?&nbsp;
              <Link href={`/signin`} legacyBehavior>
                <a className="text-orange text-center cursor-pointer underline font-bold">
                  Log In
                </a>
              </Link>
            </div>
            <div className="text-center text-[12px] font-bold text-white px-5 md:px-8">
              By continuing, you agree to Site's Terms of Service and Privacy
              policy.
            </div>

            {/* Social Login Options */}
            {/* <div className="flex justify-center space-x-6 pt-2">
              <button
                type="button"
                className="w-10 h-10 bg-white rounded-full flex items-center justify-center"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-blue-500"
                >
                  <rect width="20" height="16" x="2" y="4" rx="2" />
                  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                </svg>
              </button>
              <button
                type="button"
                className="w-10 h-10 bg-white rounded-full flex items-center justify-center"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-red-500"
                >
                  <path d="M15.05 5A5 5 0 0 1 19 8.95M15.05 1A9 9 0 0 1 23 8.94m-1 7.98v3a1.98 1.98 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.1.96.4 1.88.7 2.78a1.99 1.99 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.9.3 1.82.6 2.78.7A2 2 0 0 1 22 16.92Z" />
                </svg>
              </button>
              <button
                type="button"
                className="w-10 h-10 bg-white rounded-full flex items-center justify-center"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 20.94c1.5 0 2.75 1.06 4 1.06 3 0 6-8 6-12.22A4.91 4.91 0 0 0 17 5c-2.22 0-4 1.44-5 2-1-.56-2.78-2-5-2a4.9 4.9 0 0 0-5 4.78C2 14 5 22 8 22c1.25 0 2.5-1.06 4-1.06Z" />
                  <path d="M10 2c1 .5 2 2 2 5" />
                </svg>
              </button>
            </div> */}

            {/* <div className="w-full px-9">
              <LoadingButton
                className={{
                  border: "1px solid white",
                  background: "#E1FE26",
                  fontSize: "19px",
                  fontWeight: "bold",
                  padding: "22px",
                  borderRadius: "10px",
                  color: "black",
                }}
                isDisabled={isLoading}
                title="Sign Up"
                isLoading={isLoading}
                onClick={() => {}}
              />
            </div> */}
            {/* Action Buttons */}
            <div className="flex  justify-center gap-4 mt-6">
              <LoadingButton
                className="bg-[#ff7702] hover:bg-[#1E429F] md:w-2/3 w-1/2 md:h-[40px] h-[35px] text-white font-bold md:py-5 py-2 rounded-xl flex items-center justify-center gap-2 border-white border"
                isDisabled={isLoading}
                isLoading={isLoading}
                onClick={() => {}}
              >
                JOIN NOW
              </LoadingButton>
              {/* <LoadingButton
                className=" bg-[#00c48c] hover:bg-[#1E429F] w-2/3 h-[40px] text-white  font-bold py-5 rounded-xl flex items-center justify-center gap-2 border-white border"
                isDisabled={isLoading}
                title="CONTINUE"
                isLoading={isLoading}
                onClick={() => {}}
              /> */}
            </div>
            {registerAlertState[0] != "" && (
              <p
                style={{ color: registerAlertState[1] }}
                className="w-full p-0 m-0 font-semibold text-center text-sm text-red"
              >
                {registerAlertState[0]}
              </p>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default SignIn;
