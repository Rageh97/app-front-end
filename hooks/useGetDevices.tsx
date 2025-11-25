import { useState, useEffect } from 'react';
import axios from 'axios';

interface Device {
  device_id: number;
  user_id: number;
  device_name?: string;
  device_token?: string;
  isMainDevice?: boolean;
  last_active?: string;
  endedAt?: string;
  ip_address?: string;
  pack?: {
    pack_name: string;
  };
  tool?: {
    tool_name: string;
  };
}

interface Session {
  session_id: number;
  session: string;
  device_name?: string;
  is_main_device?: boolean;
  endedAt?: string;
  ip_address?: string;
  device_token?: string;
  isActive?: boolean;
  last_active?: string;
}

interface DevicesData {
  devices: Device[];
  active_sessions: Session[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export const useGetDevices = (): DevicesData => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [activeSessions, setActiveSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const token = localStorage.getItem('a');
const clientId  = global.clientId1328
  const fetchDevices = async () => {
    if (!token || !clientId) {
      setError('No authentication token found');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);

      
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/devices`, {
        headers: {
          'Authorization': token,
          'User-Client': clientId,
          'Content-Type': 'application/json'
        }
      });

      
    
      
      setDevices(response.data.devices || []);
      setActiveSessions(response.data.active_sessions || []);
      setError(null);
    } catch (err: any) {
     
      
      // More detailed error logging
      if (err.response) {
      
        
        setError(`Server error: ${err.response.status} - ${JSON.stringify(err.response.data)}`);
      } else if (err.request) {
        // The request was made but no response was received
        setError('No response from server');
      } else {
        // Something happened in setting up the request that triggered an Error
        setError(err.message);
      }
      
      setDevices([]);
      setActiveSessions([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDevices();
  }, [token]);

  return {
    devices,
    active_sessions: activeSessions,
    isLoading,
    error,
    refetch: fetchDevices
  };
};
