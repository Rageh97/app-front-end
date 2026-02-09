import { FunctionComponent } from "react";

interface ProductDetailProps {
    currency: "MAD" | "IQD"
    productType: "tool" | "pack" | "device" | "credits"
    productData: any;
    period: "month" | "year" | "day" | "same";
}



const ProductDetail: FunctionComponent<ProductDetailProps> = ({ period, productData, productType, currency }) => {

    // Calculate discounted price
    const getDiscountedPrice = (price: number) => {
        const discountPercentage = productData?.discount_percentage || 0;
        if (discountPercentage > 0) {
            return Math.round(price * (1 - discountPercentage / 100) * 100) / 100;
        }
        return price;
    };

    const displayPrice = (currency: "MAD" | "IQD", productType: "tool" | "pack" | "device" | "credits") => {


        if (productType === "tool") {
            if (currency === "MAD") {

                switch (period) {
                    case "day":
                        return getDiscountedPrice(productData?.tool_day_price * 10) + ` ${currency}`
                    case "month":
                        return getDiscountedPrice(productData?.tool_month_price * 10) + ` ${currency}`
                    case "year":
                        return getDiscountedPrice(productData?.tool_year_price * 10) + ` ${currency}`
                }
            }

            if (currency === "IQD") {

                switch (period) {
                    case "day":
                        return getDiscountedPrice(productData?.tool_day_price) + ` ${currency}`
                    case "month":
                        return getDiscountedPrice(productData?.tool_month_price) + ` ${currency}`
                    case "year":
                        return getDiscountedPrice(productData?.tool_year_price) + ` ${currency}`
                }
            }
        }

        if (productType === "pack") {
            if (currency === "MAD") {
                switch (period) {
                    case "day":
                        return getDiscountedPrice(productData?.monthly_price * 10) + ` ${currency}`
                    case "month":
                        return getDiscountedPrice(productData?.monthly_price * 10) + ` ${currency}`
                    case "year":
                        return getDiscountedPrice(productData?.yearly_price * 10) + ` ${currency}`
                }
            }

            if (currency === "IQD") {
                switch (period) {
                    case "day":
                        return getDiscountedPrice(productData?.monthly_price) + ` ${currency}`
                    case "month":
                        return getDiscountedPrice(productData?.monthly_price) + ` ${currency}`
                    case "year":
                        return getDiscountedPrice(productData?.yearly_price) + ` ${currency}`
                }
            }
        }
        
        // Handle device type
        if (productType === "device") {
            if (currency === "MAD") {
                // Use total_price_mad if available
                return getDiscountedPrice(productData?.total_price_mad || (productData?.monthly_price * (productData?.quantity || 1) * 10)) + ` ${currency}`
            }

            if (currency === "IQD") {
                // Use base price, multiplied by quantity
                return getDiscountedPrice(productData?.total_price || (productData?.monthly_price * (productData?.quantity || 1))) + ` ${currency}`
            }
        }
        
        // Handle credits type
        if (productType === "credits") {
            if (currency === "MAD") {
                return getDiscountedPrice(productData?.amount * 10) + ` ${currency}`
            }

            if (currency === "IQD") {
                return getDiscountedPrice(productData?.amount) + ` ${currency}`
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