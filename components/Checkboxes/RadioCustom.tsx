import { Field, useFormikContext } from "formik";

const RadioCustom = ({ id, label, type, name, value }) => {
  const { values } = useFormikContext(); // Access Formik context

  const isChecked = values[name] === value; // Check if the radio button is checked based on the value of the radio button and the value of the Formik context

  return (
    <div>
      <label
        htmlFor={id}
        className="flex items-center cursor-pointer select-none"
      >
        <div
          className="relative "
          role="group"
          aria-labelledby="my-radio-group"
        >
          <Field
            id={id}
            type={type}
            name={name}
            value={value}
            className="sr-only"
          />

          <div
            className={`mr-4 flex h-5 w-5 items-center justify-center rounded-full border ${isChecked ? "border-primary" : ""}`}
          >
            <span
              className={`h-2.5 w-2.5 rounded-full bg-transparent ${isChecked ? "!bg-primary" : ""}`}
            ></span>
          </div>
        </div>
        {label}
      </label>
    </div>
  );
};

export default RadioCustom;
