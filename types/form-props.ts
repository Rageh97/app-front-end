export type FormProps<TInitialData> =
  | {
      mode?: "add";
      onSuccess: () => void;
      initialData?: undefined;
    }
  | {
      mode: "update";
      onSuccess: () => void;
      initialData: TInitialData;
    };
