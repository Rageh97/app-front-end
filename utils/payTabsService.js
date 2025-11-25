// import axios from 'axios';

// const API_BASE_URL = `${process.env.NEXT_PUBLIC_API_URL }/api/payments`;

// // Create an axios instance with default configuration
// const payTabsApi = axios.create({
//     baseURL: API_BASE_URL,
//     timeout: 10000, // 10 seconds timeout
//     headers: {
//         'Content-Type': 'application/json'
//     }
// });

// // Interceptor for logging and error handling
// payTabsApi.interceptors.response.use(
//     response => response,
//     error => {
//         const errorMessage = error.response?.data?.message || error.message || 'Unknown error';
//         console.error('PayTabs API Error:', errorMessage);
//         throw new Error(errorMessage);
//     }
// );

// export const createPaymentPage = async (orderDetails) => {
//     try {
//         // Validate required fields
//         const requiredFields = ['amount', 'customerEmail', 'customerName'];
//         const missingFields = requiredFields.filter(field => !orderDetails[field]);
        
//         if (missingFields.length > 0) {
//             throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
//         }

//         const payload = {
//             ...orderDetails,
//             currency: orderDetails.currency || 'USD',
//             cartId: orderDetails.cartId || `cart-${Date.now()}`,
//             description: orderDetails.description || 'Product Purchase'
//         };

//         const response = await payTabsApi.post('/create-payment', payload);

//         return response.data;
//     } catch (error) {
//         console.error('Payment Page Creation Error:', {
//             message: error.response?.data?.error || error.message,
//             status: error.response?.status,
//             data: error.response?.data
//         });

//         // Throw a user-friendly error
//         throw new Error(
//             error.response?.data?.error || 
//             error.message || 
//             'Failed to create payment page. Please try again.'
//         );
//     }
// };

// export const verifyPayment = async (transactionId) => {
//     if (!transactionId) {
//         throw new Error('Transaction ID is required');
//     }

//     try {
//         const response = await payTabsApi.get(`/verify-payment/${transactionId}`);
//         return response.data;
//     } catch (error) {
//         throw error;
//     }
// };

// export const handlePaymentCallback = async (callbackData) => {
//     try {
//         const response = await payTabsApi.post('/callback', callbackData);
//         return response.data;
//     } catch (error) {
//         throw error;
//     }
// };