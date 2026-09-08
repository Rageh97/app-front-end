import useColorMode from "@/hooks/useColorMode";
import { Sun, Moon } from "lucide-react";

const DarkModeSwitcher = () => {
  const [colorMode, setColorMode] = useColorMode();
  const isDark = colorMode === "dark";

  return (
    <button
      type="button"
      onClick={() => {
        if (typeof setColorMode === "function") {
          setColorMode(isDark ? "light" : "dark");
        }
      }}
      className="p-2 md:p-2.5 rounded-full bg-white/10 dark:bg-[#12141F] border border-white/10 dark:border-zinc-800 text-zinc-200 hover:text-white hover:bg-white/20 dark:hover:bg-zinc-800 transition-all duration-200 flex items-center justify-center cursor-pointer shadow-sm"
      aria-label="Toggle theme mode"
      title={isDark ? "تغيير إلى الوضع النهاري" : "تغيير إلى الوضع الليلي"}
    >
      {isDark ? (
        <Sun className="w-4 h-4 text-amber-400 fill-amber-400/20" />
      ) : (
        <Moon className="w-4 h-4 text-emerald-400 fill-emerald-400/20" />
      )}
    </button>
  );
};

export default DarkModeSwitcher;
