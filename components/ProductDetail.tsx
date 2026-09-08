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

    const toNum = (val: any): number => {
        if (val === null || val === undefined || val === '') return 0;
        if (typeof val === 'number') return isNaN(val) ? 0 : val;
        const cleaned = String(val).replace(/,/g, '').replace(/[^0-9.]/g, '');
        const parsed = parseFloat(cleaned);
        return isNaN(parsed) ? 0 : parsed;
    };

    const displayPriceValue = (currency: "MAD" | "IQD" | "USD", productType: "tool" | "pack" | "device" | "credits") => {
        if (productType === "tool") {
            const dayPrice = toNum(productData?.tool_day_price);
            const monthPrice = toNum(productData?.tool_month_price);
            const yearPrice = toNum(productData?.tool_year_price);
            if (currency === "MAD") {
                switch (period) {
                    case "day": return getDiscountedPrice(dayPrice * 10);
                    case "month": return getDiscountedPrice(monthPrice * 10);
                    case "year": return getDiscountedPrice(yearPrice * 10);
                }
            }
            if (currency === "IQD" || currency === "USD") {
                switch (period) {
                    case "day": return getDiscountedPrice(dayPrice);
                    case "month": return getDiscountedPrice(monthPrice);
                    case "year": return getDiscountedPrice(yearPrice);
                }
            }
        }

        if (productType === "pack") {
            const monthPrice = toNum(productData?.monthly_price);
            const yearPrice = toNum(productData?.yearly_price);
            if (currency === "MAD") {
                switch (period) {
                    case "day": return getDiscountedPrice(monthPrice * 10);
                    case "month": return getDiscountedPrice(monthPrice * 10);
                    case "year": return getDiscountedPrice(yearPrice * 10);
                }
            }
            if (currency === "IQD" || currency === "USD") {
                switch (period) {
                    case "day": return getDiscountedPrice(monthPrice);
                    case "month": return getDiscountedPrice(monthPrice);
                    case "year": return getDiscountedPrice(yearPrice);
                }
            }
        }
        
        if (productType === "device") {
            const totalPriceMad = toNum(productData?.total_price_mad);
            const monthlyPrice = toNum(productData?.monthly_price);
            const quantity = toNum(productData?.quantity) || 1;
            const totalPrice = toNum(productData?.total_price);
            if (currency === "MAD") return getDiscountedPrice(totalPriceMad || (monthlyPrice * quantity * 10));
            return getDiscountedPrice(totalPrice || (monthlyPrice * quantity));
        }
        
        if (productType === "credits") {
            const amount = toNum(productData?.amount ?? productData?.monthly_price);
            if (currency === "MAD") return getDiscountedPrice(amount * 10);
            return getDiscountedPrice(amount);
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