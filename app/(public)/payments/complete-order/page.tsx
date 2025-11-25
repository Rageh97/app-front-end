'use client'
import axios from 'axios';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from "react";
import logo from "@/public/images/Icon256.ico"
import checkingMark from "@/public/images/checking-mark.png"

const completePayment = () => {
    const router = useRouter()

    const searchParams = useSearchParams();

    const paymentToken = searchParams.get('token')

    const [isChecking, setIsChecking] = useState<boolean>(true)

    useEffect(() => {
        if (!paymentToken || localStorage.getItem('a') === null) {
            router.push('/dashboard')
        }
        else {
            if (!global.checkPayment) {
                checkPayment(paymentToken)
                global.checkPayment = true;
            }
        }
    }, [paymentToken])

    const checkPayment = async (paymentToken: string) => {

        const token = localStorage.getItem('a')

        if (token === null) {
            setIsChecking(false)
            router.push('/dashboard')
        }

        const data = {
            token: token,
            paymentToken: paymentToken,
        };

        await axios.post(process.env.NEXT_PUBLIC_API_URL + "/api/payment/complete-paypal-payment", data)
            .then(response => {
                if (response.status === 200) {
                    setIsChecking(false)
                    setTimeout(() => {
                        router.push('/subscriptions')
                    }, 1500);
                }
                else {
                    router.push('/dashboard')
                }
            })
            .catch(error => {
                router.push('/dashboard')
            });
    }

    return (
        <div className="flex gap-4 flex-col justify-center items-center w-full h-[100vh]">
            {isChecking ?
                <>
                    <img className="max-w-[60px]" src={logo.src} alt="logo" />
                    <p className='text-center'>
                        Just a second, I'll be right with you.
                    </p>
                    <div className="loaderToolzMarketDark text-black"></div>
                </>
                :
                <>
                    <img className="max-w-[60px]" src={logo.src} alt="logo" />
                    <p className='text-center'>
                        Completed, Please wait ...
                    </p>
                    <img className="max-w-[30px]" src={checkingMark.src} alt="logo" />
                </>
            }
        </div>
    )
}

export default completePayment