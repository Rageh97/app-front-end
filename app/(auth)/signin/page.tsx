"use client";
import { useEffect, useState } from "react";
import UseSignIn from "@/hooks/useSignIn";
import { useFormik } from "formik";
import * as Yup from "yup";
import LoadingButton from "@/components/LoadingButton";
import Link from "next/link";
import { Mail, Eye, Smartphone, EyeOff } from "lucide-react";
import { useMyInfo } from "@/utils/user-info/getUserInfo";
import i18n from "@/i18n";

const SignIn: React.FC = () => {
    const [dynamicLogoUrl, setDynamicLogoUrl] = useState<string | null>(null);
    // const staticLogoPath = "/images/logoN.png";
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const initialLoginAlertState: [string, string] = ["", ""];
  const [loginAlertState, setLoginAlertState] = useState<[string, string]>(
    initialLoginAlertState
  );
  const [loginMode, setLoginMode] = useState<'regular' | 'device'>('regular');

  const requiredMessage = "This field is required.";

  const loginFormik = useFormik({
    initialValues: {
      email: "",
      password: "",
      deviceToken: "",
    },
    validationSchema: Yup.object({
      email: Yup.string().when('$loginMode', {
        is: 'regular',
        then: () => Yup.string().required(requiredMessage),
        otherwise: () => Yup.string()
      }),
      password: Yup.string().when('$loginMode', {
        is: 'regular',
        then: () => Yup.string().required(requiredMessage),
        otherwise: () => Yup.string()
      }),
      deviceToken: Yup.string().when('$loginMode', {
        is: 'device',
        then: () => Yup.string().required(requiredMessage),
        otherwise: () => Yup.string()
      })
    }),
    onSubmit: (values) => {
      if (loginMode === 'device') {
        UseSignIn(values.deviceToken, setIsLoading, setLoginAlertState);
      } else {
        UseSignIn(values, setIsLoading, setLoginAlertState);
      }
    },
  });
// ...............................
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

// const displayLogoUrl = dynamicLogoUrl || staticLogoPath;
  return (
    <div dir="ltr" className="w-full flex bg-white auth-container h-full overflow-hidden relative">
      <img src="/images/anime-top (2).png" className="absolute hidden lg:block max-w-[100px] opacity-70 blur-[1px] animate-rotating " />
      <img src="/images/anime-bottom (2).png" className="absolute hidden lg:block bottom-10 left-1/3 ml-20 max-w-[100px] opacity-70 blur-[1px] animate-rotating" />
      <div className="h-full flex flex-col justify-center items-center w-full lg:w-1/2 px-2 md:px-4">
        <div className="w-full flex justify-center p-4 md:p-10">
          <img src="/images/logoN.png" className="max-w-[200px] " />
        </div>
        <div   className="w-full mb-[80px] relative max-w-[450px] p-[30px] bg-[linear-gradient(180deg,_#00c48c,_#4f008c)] rounded-[37px] border-[1px] border-white">
          <div className="flex justify-center md:mb-6 mb-2">
            <div className="bg-[#1a0b2e] p-1 rounded-lg">
              <button
                onClick={() => setLoginMode('regular')}
                className={`px-4 py-2 rounded-md ${
                  loginMode === 'regular' ? 'bg-[#ff7702] text-white' : 'text-white'
                }`}
              >
                Email Login
              </button>
              <button
                onClick={() => setLoginMode('device')}
                className={`px-4 py-2 rounded-md ${
                  loginMode === 'device' ? 'bg-[#ff7702] text-white' : 'text-white'
                }`}
              >
                Device Login
              </button>
            </div>
          </div>

          <form
            className="space-y-2 md:space-y-5 pt-5"
            noValidate
            onSubmit={loginFormik.handleSubmit}
          >
            {loginMode === 'regular' ? (
              <>
                <div className="relative">
                  <input
                    type="email"
                    name="email"
                    id="email"
                    className="border-[#FFA500] placeholder-[#afafaf] border-2 border-orange-400 text-white bg-[#1a0b2e] px-4 py-[9px] md:py-[14px] text-md font-bold rounded-xl focus:ring-[#FFA500] focus:border-[#FFA500] block w-full"
                    placeholder="Email"
                    onChange={loginFormik.handleChange}
                    onBlur={loginFormik.handleBlur}
                    value={loginFormik.values.email}
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <Mail className="h-5 w-5 text-white" />
                  </div>
                  {loginFormik.touched.email && loginFormik.errors.email ? (
                    <p className="text-[#DC2626] text-[13px] font-bold">{loginFormik.errors.email}</p>
                  ) : null}
                </div>

                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    id="password"
                    placeholder="Password"
                    className="border-[#FFA500] placeholder-[#afafaf] border-2 border-orange-400 text-white bg-[#1a0b2e] px-4 py-[9px] md:py-[14px] text-md font-bold rounded-xl focus:ring-[#FFA500] focus:border-[#FFA500] block w-full"
                    onChange={loginFormik.handleChange}
                    onBlur={loginFormik.handleBlur}
                    value={loginFormik.values.password}
                  />
                  <div onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer">
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-white" />
                    ) : (
                      <Eye className="h-5 w-5 text-white" />
                    )}
                  </div>
                  {loginFormik.touched.password && loginFormik.errors.password ? (
                    <p className="text-[#DC2626] text-[13px] font-bold">
                      {loginFormik.errors.password}
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
              </>
            ) : (
              <div className="relative">
                <input
                  type="text"
                  name="deviceToken"
                  id="deviceToken"
                  placeholder="Enter your device code"
                  className="border-[#FFA500] placeholder-[#afafaf] border-2 border-orange-400 text-white bg-[#1a0b2e] px-4 py-[9px] md:py-[14px] text-md font-bold rounded-xl focus:ring-[#FFA500] focus:border-[#FFA500] block w-full"
                  onChange={loginFormik.handleChange}
                  onBlur={loginFormik.handleBlur}
                  value={loginFormik.values.deviceToken}
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <Smartphone className="h-5 w-5 text-white" />
                </div>
                {loginFormik.touched.deviceToken && loginFormik.errors.deviceToken ? (
                  <p className="text-[#DC2626] text-[13px] font-bold">
                    {loginFormik.errors.deviceToken}
                  </p>
                ) : null}
              </div>
            )}

            <div className="flex flex-col items-center md:flex-row justify-center text-white text-[13px] sm:text-sm font-bold">
              Need to create an account?&nbsp;
              <Link href={`/signup`} legacyBehavior>
                <a className="text-orange text-center cursor-pointer underline font-bold">
                  Create Account
                </a>
              </Link>
            </div>

            <div className="text-center text-[12px] font-bold text-white px-5 md:px-8">
              By continuing, you agree to Site's Terms of Service and Privacy policy.
            </div>

            <div className="flex gap-4 mt-6 items-center justify-center">
              <LoadingButton
                className="bg-[#ff7702] hover:bg-[#1E429F] md:w-2/3 w-1/2 md:h-[40px] h-[35px] text-white font-bold md:py-5 py-2 rounded-xl flex items-center justify-center gap-2 border-white border"
                isDisabled={isLoading}
                isLoading={isLoading}
                onClick={() => {}}
              >
               CONTINUE
              </LoadingButton>
              
            </div>

            {loginAlertState[0] != "" && (
              <p
                style={{ color: loginAlertState[1] }}
                className="w-full p-0 m-0 font-semibold text-center text-sm text-red"
              >
                {loginAlertState[0]}
              </p>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default SignIn;
