import { useEffect } from "react";
import useLocalStorage from "./useLocalStorage";

const useColorMode = () => {
  const [colorMode, setColorMode] = useLocalStorage("color-theme", "dark");

  useEffect(() => {
    if (colorMode !== "dark") {
      setColorMode("dark");
    }

    const className = "dark";
    const bodyClass = window.document.body.classList;
    const htmlClass = window.document.documentElement.classList;

    bodyClass.add(className);
    htmlClass.add(className);
  }, [colorMode, setColorMode]);

  return [colorMode, setColorMode];
};

export default useColorMode;
