import { NewOfflinePayment } from "@/types/offline-payment/new-offline-payment-dto";
import api from "@/utils/api";
import { useMutation, useQueryClient } from "react-query";

export async function createPayment(data: NewOfflinePayment, file?: File) {
  if (file) {
    // Handle file upload with FormData
    const formData = new FormData();
    formData.append('userFullName', data.userFullName || '');
    formData.append('period', data.period || '');
    formData.append('paymentMethod', data.paymentMethod || '');
    formData.append('productType', data.productType || '');
    formData.append('productId', (data.productId || 0).toString());
    formData.append('paymentProof', file);
    
    // Add device-specific data if present
    if (data.deviceName) {
      formData.append('deviceName', data.deviceName);
    }
    if (data.quantity) {
      formData.append('quantity', data.quantity.toString());
    }
    if (data.isToolDevice !== undefined) {
      formData.append('isToolDevice', data.isToolDevice.toString());
    }
    if (data.couponCode) {
      formData.append('couponCode', data.couponCode);
    }

    const response = await api.post("/api/payment/offline-payment", formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } else {
    // Handle regular JSON data (fallback)
    const response = await api.post("/api/payment/offline-payment", data);
    return response.data;
  }
}

export const useOfflinePayment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ data, file }: { data: NewOfflinePayment; file?: File }) => {
      return createPayment(data, file);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["offline-payment"]);
    },
  });
};
