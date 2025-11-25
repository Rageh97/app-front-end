import { FunctionComponent } from "react";

interface ProductDetailProps {
    currency: "MAD" | "$"
    productType: "tool" | "pack" | "device" | "credits"
    productData: any;
    period: "month" | "year" | "day" | "same";
}



const ProductDetail: FunctionComponent<ProductDetailProps> = ({ period, productData, productType, currency }) => {

    const displayPrice = (currency: "MAD" | "$", productType: "tool" | "pack" | "device" | "credits") => {


        if (productType === "tool") {
            if (currency === "MAD") {

                switch (period) {
                    case "day":
                        return productData?.tool_day_price * 10 + ` ${currency}`
                    case "month":
                        return productData?.tool_month_price * 10 + ` ${currency}`
                    case "year":
                        return productData?.tool_year_price * 10 + ` ${currency}`
                }
            }

            if (currency === "$") {

                switch (period) {
                    case "day":
                        return productData?.tool_day_price + ` ${currency}`
                    case "month":
                        return productData?.tool_month_price + ` ${currency}`
                    case "year":
                        return productData?.tool_year_price + ` ${currency}`
                }
            }
        }

        if (productType === "pack") {
            if (currency === "MAD") {
                switch (period) {
                    case "day":
                        return productData?.monthly_price * 10 + ` ${currency}`
                    case "month":
                        return productData?.monthly_price * 10 + ` ${currency}`
                    case "year":
                        return productData?.yearly_price * 10 + ` ${currency}`
                }
            }

            if (currency === "$") {
                switch (period) {
                    case "day":
                        return productData?.monthly_price + ` ${currency}`
                    case "month":
                        return productData?.monthly_price + ` ${currency}`
                    case "year":
                        return productData?.yearly_price + ` ${currency}`
                }
            }
        }
        
        // Handle device type
        if (productType === "device") {
            if (currency === "MAD") {
                // Use total_price_mad if available
                return (productData?.total_price_mad || (productData?.monthly_price * (productData?.quantity || 1) * 10)) + ` ${currency}`
            }

            if (currency === "$") {
                // Use base price, multiplied by quantity
                return (productData?.total_price || (productData?.monthly_price * (productData?.quantity || 1))) + ` ${currency}`
            }
        }
        
        // Handle credits type
        if (productType === "credits") {
            if (currency === "MAD") {
                return (productData?.amount * 10) + ` ${currency}`
            }

            if (currency === "$") {
                return productData?.amount + ` ${currency}`
            }
        }
    }    

    return (
        <div
            className="bg-[#00c48c]   text-center bg-opacity-20 rounded-xl px-3 py-1 inner-shadow text-white"
            role="alert"
        >
            <span className="font-bold text-xs lg:text-lg  text-[#00c48c]">Product : </span>

            {productType === 'device' 
                ? `${productData?.deviceName ? ` (${productData.deviceName})` : 'Additional Device'} `
                : `1 ${period} of ${productType === 'tool' ? productData?.tool_name : productData?.pack_name + ' Pack'}`
            }

            <br />

            <span className="font-bold text-[#00c48c]">Total : </span>

            {displayPrice(currency, productType)}
        </div>
    )
}

export default ProductDetail