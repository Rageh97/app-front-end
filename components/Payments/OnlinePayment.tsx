import { FunctionComponent, useEffect, useState } from "react";
import LoadingButton from "../LoadingButton";
import ToolErrorModal from "../Modals/ToolErrorModal";
import { NewOnlinePayment } from "@/types/online-payment/new-online-payment-dto";
import ProductDetail from "../ProductDetail";
import axios from "axios";

const OnlinePayment: FunctionComponent<NewOnlinePayment> = ({
  period,
  paymentMethod,
  productType,
  productData,
  productId,
}) => {
  const [openErrorModal, setIsOpenErrorModal] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>(null);
  const [isPaying, setIsPaying] = useState<boolean>(false);

  const requestOnlinePayment = async (paymentMethod: "paypal") => {

    setIsPaying(true)

    const data = {
      token: localStorage.getItem('a'),
      period,
      paymentMethod,
      productType,
      productId,
    };

    await axios.post(process.env.NEXT_PUBLIC_API_URL + "/api/payment/online-payment", data, {
      headers: {
        "Content-Type": "application/json",
        "User-Client": global.clientId1328, // Custom header for visitorId
      },
    })
      .then(response => {
        if (response.status === 200) {
          window.open(response?.data, "_self")
        }
        else {
          setIsPaying(false)
        }
      })
      .catch(error => {
        setIsPaying(false)
        setErrorMessage("Something went wrong, please try again later.");
        setIsOpenErrorModal(true);
      });
  }

  return (
    <>
      <div className="w-full h-full gap-3 flex flex-col justify-center items-center relative">
        <ProductDetail productType={productType} productData={productData} period={period} currency="IQD" />

        {
          // paymentMethod === "paypal" &&
          // <>
          //   <img
          //     src="/images/paypal.png"
          //     className="max-w-[150px]"
          //     alt="ORANGE MONEY"
          //   />
          //   {/* <p className="text-sm text-black">Coming Soon ...</p> */}
          //   <LoadingButton
          //     isDisabled={isPaying}
          //     title="Confirm & Pay"
          //     isLoading={isPaying}
          //     className={{ width: "auto" }}
          //     loadingPaddingX={28.5}
          //     onClick={() => { requestOnlinePayment("paypal") }}
          //   />
          // </>
        }
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

export default OnlinePayment;
