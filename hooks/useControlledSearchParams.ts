import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";

export function useControlledSearchParams() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const push = useCallback(
    (params: URLSearchParams) => {
      const search = params.toString();
      const query = search ? `?${search}` : "";
      router.push(`${pathname}${query}`);
    },
    [pathname, router]
  );

  const current = useMemo(() => {
    return new URLSearchParams(Array.from(searchParams.entries()));
  }, [searchParams]);

  const setItem = useCallback(
    (key: string, value: string) => {
      current.delete(key);
      current.append(key, value);
      push(current);
    },
    [current, push]
  );

  const removeItem = useCallback(
    (key: string) => {
      current.delete(key);
      push(current);
    },
    [current, push]
  );

  const getItem = useCallback(
    (key: string) => {
      return current.get(key);
    },
    [current]
  );

  return {
    setItem,
    removeItem,
    getItem,
  };
}
