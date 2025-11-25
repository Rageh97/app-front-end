import axios from "axios";

const UseForgetPassword = async (
  authData: {},
  setIsLoading: any,
  setAlertState: any
) => {
  setIsLoading(true);
  setAlertState(["", ""]);

  await axios
    .post(
      process.env.NEXT_PUBLIC_API_URL + "/api/auth/forgotpassword/",
      authData
    )
    .then((response) => {
      if (response.status == 200) {
        setAlertState([response.data, "green"]);
        setTimeout(() => {
          setIsLoading(false);
        }, 1500);
      }
      if (response.status == 267) {
        setAlertState([response.data, "red"]);
        setTimeout(() => {
          setIsLoading(false);
        }, 1000);
      }
      267;
    })
    .catch((error) => {
      setIsLoading(false);
      setAlertState(["Something went wrong, Try again later.", "red"]);
    });
};

export default UseForgetPassword;
