import { FunctionComponent } from "react";

interface ProductDetailProps {
    currency: "MAD" | "IQD" | "USD"
    productType: "tool" | "pack" | "device" | "credits"
    productData: any;
    period: "month" | "year" | "day" | "same";
    originalPrice?: number; // Added to support showing original price
}

const ProductDetail: FunctionComponent<ProductDetailProps> = ({ period, productData, productType, currency, originalPrice }) => {

    // Calculate discounted price
    const getDiscountedPrice = (price: number) => {
        const discountPercentage = productData?.discount_percentage || 0;
        if (discountPercentage > 0) {
            return Math.round(price * (1 - discountPercentage / 100) * 100) / 100;
        }
        return price;
    };

    const displayPriceValue = (currency: "MAD" | "IQD" | "USD", productType: "tool" | "pack" | "device" | "credits") => {
        if (productType === "tool") {
            if (currency === "MAD") {
                switch (period) {
                    case "day": return getDiscountedPrice(productData?.tool_day_price * 10);
                    case "month": return getDiscountedPrice(productData?.tool_month_price * 10);
                    case "year": return getDiscountedPrice(productData?.tool_year_price * 10);
                }
            }
            if (currency === "IQD" || currency === "USD") {
                switch (period) {
                    case "day": return getDiscountedPrice(productData?.tool_day_price);
                    case "month": return getDiscountedPrice(productData?.tool_month_price);
                    case "year": return getDiscountedPrice(productData?.tool_year_price);
                }
            }
        }

        if (productType === "pack") {
            if (currency === "MAD") {
                switch (period) {
                    case "day": return getDiscountedPrice(productData?.monthly_price * 10);
                    case "month": return getDiscountedPrice(productData?.monthly_price * 10);
                    case "year": return getDiscountedPrice(productData?.yearly_price * 10);
                }
            }
            if (currency === "IQD" || currency === "USD") {
                switch (period) {
                    case "day": return getDiscountedPrice(productData?.monthly_price);
                    case "month": return getDiscountedPrice(productData?.monthly_price);
                    case "year": return getDiscountedPrice(productData?.yearly_price);
                }
            }
        }
        
        if (productType === "device") {
            if (currency === "MAD") return getDiscountedPrice(productData?.total_price_mad || (productData?.monthly_price * (productData?.quantity || 1) * 10));
            return getDiscountedPrice(productData?.total_price || (productData?.monthly_price * (productData?.quantity || 1)));
        }
        
        if (productType === "credits") {
            if (currency === "MAD") return getDiscountedPrice(productData?.amount * 10);
            return getDiscountedPrice(productData?.amount);
        }
        return 0;
    }

    const price = displayPriceValue(currency, productType);

    return (
        <div
            className="bg-white/5 border border-[#00c48c]/20 text-center rounded-xl px-4 py-2 text-white shadow-sm"
            role="alert"
        >
            <div className="flex flex-col gap-0.5">
                <div className="flex items-center justify-center gap-1.5 flex-wrap">
                    <span className="font-bold text-[10px] lg:text-xs text-[#00c48c] opacity-80 uppercase tracking-wider">Product:</span>
                    <span className="text-xs lg:text-sm font-medium">
                        {productType === 'device' 
                            ? `${productData?.deviceName ? ` (${productData.deviceName})` : 'Additional Device'} `
                            : `1 ${period} of ${productType === 'tool' ? productData?.tool_name : productData?.pack_name + ' Pack'}`
                        }
                    </span>
                </div>

                <div className="flex items-center justify-center gap-2 mt-1">
                    <span className="font-bold text-[10px] lg:text-xs text-[#00c48c] opacity-80 uppercase tracking-wider">Total:</span>
                    <div className="flex items-center gap-2">
                        {originalPrice && originalPrice > price && (
                            <span className="text-[10px] lg:text-xs text-red-500/70 line-through decoration-red-600/80 font-mono">
                                {originalPrice.toLocaleString('en-US')} {currency}
                            </span>
                        )}
                        <span className="text-sm lg:text-base font-black text-[#00c48c] font-mono">
                            {price.toLocaleString('en-US')} {currency}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ProductDetail;