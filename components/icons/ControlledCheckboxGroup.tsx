import React, { FunctionComponent } from "react";
import { SelectionOption } from "@/types/selection-option";
import CheckboxItem from "@/components/FormFields/CheckboxItem";

type Props = {
  options: SelectionOption[];
  selected: SelectionOption["value"][];
  onChange: (selected: SelectionOption["value"][]) => void;
};

const ControlledCheckboxGroup: FunctionComponent<Props> = ({
  options,
  selected,
  onChange,
}) => {
  function getOnClick(value: SelectionOption["value"]) {
    return () => {
      if (selected.includes(value)) {
        onChange(selected.filter((v) => v !== value));
      } else {
        onChange([...selected, value]);
      }
    };
  }

  return options.map(({ value, label }) => (
    <CheckboxItem
      onClick={getOnClick(value)}
      onChange={getOnClick(value)}
      label={label}
      id={value}
      key={value}
      value={value}
      checked={selected.includes(value)}
    />
  ));
};

export default ControlledCheckboxGroup;
