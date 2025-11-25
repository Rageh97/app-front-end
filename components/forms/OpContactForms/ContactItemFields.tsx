import React, { FunctionComponent } from "react";
import { useField } from "formik";
import InputField from "@/components/FormFields/InputField";
import Button from "@/components/buttons/Button";
import TrashIcon from "@/components/icons/TrashIcon";

type Props = {
  order: number;
  onRemove?: () => void;
};

const ContactItemFields: FunctionComponent<Props> = ({ order, onRemove }) => {
  const [nameInput, nameMeta] = useField({
    name: `contacts[${order}].name`,
    defaultValue: "",
  });
  const [emailField, emailMeta] = useField({
    name: `contacts[${order}].email`,
    defaultValue: "",
  });
  const [phoneField, phoneMeta] = useField({
    name: `contacts[${order}].phone_number`,
    defaultValue: "",
  });
  return (
    <div className="mb-4.5 flex flex-col gap-6 xl:flex-row">
      <InputField
        label={"Naam"}
        {...nameInput}
        placeholder={"Naam"}
        required={true}
        error={nameMeta.touched && nameMeta.error}
      />
      <InputField
        label={"Email"}
        placeholder={"Email"}
        required={true}
        {...emailField}
        error={emailMeta.touched && emailMeta.error}
      />
      <InputField
        label={"Telefoon"}
        placeholder={"Telefoon"}
        required={true}
        {...phoneField}
        error={phoneMeta.touched && phoneMeta.error}
      />
      <Button
        type={"button"}
        buttonType={"Danger"}
        onClick={onRemove}
        className="flex self-start items-center px-4 ml-auto mt-9"
      >
        <TrashIcon />
      </Button>
    </div>
  );
};

export default ContactItemFields;
