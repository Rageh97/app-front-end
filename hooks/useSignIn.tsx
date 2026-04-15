import axios from "axios";
import FingerprintJS from "@fingerprintjs/fingerprintjs";

const UseSignIn = async (
  authData: {} | string, // Can be either auth data object or device token string
  setIsLoading: any,
  setAlertState: any,
  deviceToken?: string  
) => {
  setIsLoading(true);
  setAlertState(["", ""]);

  try {
    // Load FingerprintJS and get the visitorId
    const fp = await FingerprintJS.load();
    const result = await fp.get();
    const deviceInfo = {
      os: navigator.platform,
      browser: navigator.userAgent || "Unknown",
      screen: `${window.screen.width}x${window.screen.height}`
    };

    const config = {
      headers: {
        "Content-Type": "application/json",
        "User-Client": result.visitorId,
        "X-Device-Info": JSON.stringify(deviceInfo)
      },
    };

    // If authData is a string, treat it as a device token
    const requestBody = typeof authData === 'string' 
      ? { deviceToken: authData }
      : { ...authData, ...(deviceToken ? { deviceToken } : {}) };
  if (requestBody.deviceToken === '') {
      delete requestBody.deviceToken;
    }
    // Perform the login request
    const response = await axios.post(
      process.env.NEXT_PUBLIC_API_URL + "/api/auth/login/",
      requestBody,
      config
    );

    if (response.status === 200) {
      localStorage.setItem("a", response.data?.token);
      
      // Set username cookie for the extension/panel using database verified email
      const usernameValue = response.data?.email || response.data?.user?.email || response.data?.userData?.email || response.data?.username;
      if (usernameValue) {
        document.cookie = `username=${usernameValue}; path=/; max-age=604800; SameSite=Lax`;
      }

      // If this is a device token login, mark it in sessionStorage
      if (requestBody.deviceToken) {
        sessionStorage.setItem('deviceToken', requestBody.deviceToken);
        sessionStorage.setItem('isAdditionalDevice', 'true');
        
      } else {
        // Regular login - clear any previous device markers
        sessionStorage.removeItem('deviceToken');
        sessionStorage.removeItem('isAdditionalDevice');
        
      }
      
      open("/dashboard", "_self");
    } else if (response.status === 267) {
      setAlertState([response.data, "red"]);
      setIsLoading(false);
    }
  } catch (error) {
    setIsLoading(false);
    setAlertState(["Something went wrong, Try again later.", "red"]);
    console.error(error);
  }
};

export default UseSignIn;
