// hooks/useReviews.ts
import { useState } from 'react';
import axios from 'axios';

interface Review {
  review_id: number;
  user_id: number;

  comment: string;
  isApproved: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  user?: {
    first_name: string;
    last_name: string;
  };
}

interface ReviewApiResponse {
  success: boolean;
  data?: Review | Review[];
  message?: string;
}

const useReviews = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Common request handler
  const makeRequest = async <T,>(
    requestFn: () => Promise<T>,
    successMessage?: string
  ): Promise<T | undefined> => {
    setLoading(true);
    setError(null);
    try {
      const response = await requestFn();
      if (successMessage) {
        
      }
      return response;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 
                         err.message || 
                         'An error occurred';
      setError(errorMessage);
      console.error('Review API error:', errorMessage);
      return undefined;
    } finally {
      setLoading(false);
    }
  };

  // Get all approved reviews
  const getApprovedReviews = async (): Promise<Review[]> => {
    return makeRequest(async () => {
      const response = await axios.get<Review[]>(process.env.NEXT_PUBLIC_API_URL + '/api/reviews');
      return response.data;
    }) || [];
  };

  // Admin: Get pending reviews
  const getPendingReviews = async (): Promise<Review[]> => {
    return makeRequest(async () => {
      const token = localStorage.getItem('a');
    //   const clientId = localStorage.getItem('client_id');
      
      const response = await axios.get<Review[]>(process.env.NEXT_PUBLIC_API_URL + '/api/reviews/pending', {
        headers: {
          'Authorization': `Bearer ${token}`,
          "User-Client": global.clientId1328, // Custom header for visitorId
        }
      });
      return response.data;
    }) || [];
  };

  // Admin: Approve review
  const approveReview = async (reviewId: number): Promise<boolean> => {
    const result = await makeRequest(async () => {
      const token = localStorage.getItem('a');
    //   const clientId = localStorage.getItem('client_id');
      
      const response = await axios.put<ReviewApiResponse>(process.env.NEXT_PUBLIC_API_URL + 
        `/api/reviews/approve/${reviewId}`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            "User-Client": global.clientId1328, // Custom header for visitorId
          }
        }
      );
      return response.data;
    }, 'Review approved successfully');

    return result?.success || false;
  };

  // Admin: Delete review
  const deleteReview = async (reviewId: number): Promise<boolean> => {
    const result = await makeRequest(async () => {
      const token = localStorage.getItem('a');
      
      const response = await axios.delete<ReviewApiResponse>(process.env.NEXT_PUBLIC_API_URL + 
        `/api/reviews/${reviewId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            "User-Client": global.clientId1328, // Custom header for visitorId
          }
        }
      );
      return response.data;
    }, 'Review deleted successfully');

    return result?.success || false;
  };

  // Submit new review
//   const submitReview = async (reviewData: {
   
//     comment: string;
//   }): Promise<boolean> => {
//     const result = await makeRequest(async () => {
//       const token = localStorage.getItem('a');
//     //   const clientId = localStorage.getItem('client_id');
      
//       const response = await axios.post<ReviewApiResponse>(process.env.NEXT_PUBLIC_API_URL + 
//         '/api/reviews',
//         reviewData,
//         {
//           headers: {
//             'Authorization': `Bearer ${token}`,
//             // 'User-Client': clientId,
//             'Content-Type': 'application/json'
//           }
//         }
//       );
//       return response.data;
//     }, 'Review submitted successfully');

//     return result?.success || false;
//   };

  return {
    loading,
    error,
    getApprovedReviews,
    getPendingReviews,
    approveReview,
    deleteReview,
    // submitReview,
    clearError: () => setError(null)
  };
};

export default useReviews;