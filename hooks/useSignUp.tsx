import axios from "axios";

const UseSignUp = async (
  authData: {},
  setIsLoading: any,
  setAlertState: any
) => {
  setIsLoading(true);
  setAlertState(["", ""]);

  await axios
    .post(process.env.NEXT_PUBLIC_API_URL + "/api/auth/register/", authData)
    .then((response) => {
      if (response.status == 200) {
        setAlertState([response.data, "green"]);
        setTimeout(() => {
          open("/signin", "_self");
        }, 1500);
      }
      if (response.status == 267) {
        setAlertState([response.data, "red"]);
        setIsLoading(false);
      }
    })
    .catch((error) => {
      setIsLoading(false);
      setAlertState(["Something went wrong, Try again later.", "red"]);
    });
};

export default UseSignUp;
