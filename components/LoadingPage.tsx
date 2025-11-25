import { FunctionComponent } from "react";
import Logo from "@/public/images/Icon256.ico"
interface LoadingPageProps { }

const LoadingPage: FunctionComponent<LoadingPageProps> = ({ }) => {
  return (
    <div className="flex gap-4 flex-col justify-center items-center w-full h-[100vh] bg-[#1C2434]">
      <img className="max-w-[60px]" src={Logo.src} alt="logo" />
      <p className="text-white text-[20px] font-bold">Nexus Toolz</p>
      <div className="loaderToolzMarket"></div>
    </div>
  )
};

export default LoadingPage;
