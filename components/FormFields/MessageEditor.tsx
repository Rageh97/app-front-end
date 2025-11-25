import React, {
  FormEvent,
  FunctionComponent,
  useCallback,
  useRef,
} from "react";
import ClipIcon from "@/components/icons/ClipIcon";
import SendIcon from "@/components/icons/SendIcon";
import Button from "@/components/buttons/Button";

type Props = {
  onSubmit: (message: string) => void;
  disabled?: boolean;
};

const MessageEditor: FunctionComponent<Props> = ({
  onSubmit: onSubmitCallback,
  disabled,
}) => {
  const formRef = useRef<HTMLFormElement>(null);
  const messageEditorRef = useRef<HTMLInputElement>(null);
  const onSubmit = useCallback(
    (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const message = messageEditorRef.current?.value;
      formRef.current.reset();
      onSubmitCallback(message);
    },
    [onSubmitCallback]
  );
  return (
    <form
      ref={formRef}
      onSubmit={onSubmit}
      className="flex items-center justify-between space-x-4.5"
    >
      <div className="relative w-full">
        <input
          ref={messageEditorRef}
          autoComplete={"off"}
          disabled={disabled}
          type="text"
          id="message-editor"
          placeholder="Type something here"
          className="h-13 w-full rounded-md border border-stroke bg-gray pl-5 pr-19 text-black placeholder-body outline-none focus:border-primary dark:border-strokedark dark:bg-boxdark-2 dark:text-white"
        />
        <div className="absolute right-5 top-1/2 inline-flex -translate-y-1/2 items-center justify-end space-x-4">
          <button type="button" className="hover:text-primary">
            <ClipIcon />
          </button>
        </div>
      </div>
      <Button
        type={"submit"}
        buttonType={disabled ? "Secondary" : "Primary"}
        className="h-13 max-w-13 px-0 w-full flex items-center justify-center"
      >
        <SendIcon />
      </Button>
    </form>
  );
};

export default MessageEditor;
