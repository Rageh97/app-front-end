// import React, { useState } from 'react';
// import { createPaymentPage } from '@/utils/payTabsService';

// const PayTabsPayment = ({ orderDetails, onPaymentInitiated, onPaymentError }) => {
//     const [isLoading, setIsLoading] = useState(false);

//     const initiatePayment = async () => {
//         setIsLoading(true);
//         try {
//             );

//             // Comprehensive validation
//             const requiredFields = ['amount', 'customerEmail', 'customerName'];
//             const missingFields = requiredFields.filter(field => !orderDetails[field]);

//             if (missingFields.length > 0) {
//                 throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
//             }

//             // Prepare payment details
//             const paymentDetails = {
//                 ...orderDetails,
//                 cartId: orderDetails.cartId || `cart-${Date.now()}`,
//                 currency: orderDetails.currency || 'USD',
//                 description: orderDetails.description || 'Product Purchase',
//                 billingAddress: orderDetails.billingAddress || {}
//             };

//             );

//             // Create payment page
//             const response = await createPaymentPage(paymentDetails);

//             );

//             // Check if payment URL is returned
//             if (response.redirect_url) {
//                 // Call optional callback if provided
//                 onPaymentInitiated?.(response);
                
//                 // Redirect to PayTabs payment page
//                 window.location.href = response.redirect_url;
//             } else {
//                 throw new Error('Unable to create payment page: No redirect URL');
//             }
//         } catch (err) {
//             console.error('FULL Payment Initiation Error:', {
//                 message: err.message,
//                 details: err.response?.data,
//                 orderDetails: orderDetails
//             });
//             onPaymentError?.(err);
//         } finally {
//             setIsLoading(false);
//         }
//     };

//     return (
//         <button 
//             onClick={initiatePayment} 
//             disabled={isLoading}
//             className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
//         >
//             {isLoading ? 'Processing...' : 'Pay with PayTabs'}
//         </button>
//     );
// };

// export default PayTabsPayment;