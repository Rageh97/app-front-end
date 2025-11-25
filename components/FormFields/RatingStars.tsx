import React from "react";
import StarIcon from "../svg/StarIcon";

interface RatingProps {
  label?: string;
  value: number;
  required?: boolean;
  onChange?: (newValue: number) => void;
}

const StarIconComponent: React.FC<{
  width: number;
  selected: boolean;
  height: number;
}> = ({ width, height, selected }) => {
  return (
    <>
      {selected ? (
        <StarIcon width={width} height={height} color="#FACA15" />
      ) : (
        <StarIcon width={width} height={height} color="gray" />
      )}
    </>
  );
};

const Rating: React.FC<RatingProps> = ({
  value,
  onChange,
  label,
  required,
}) => {
  const handleClick = (newValue: number) => {
    onChange(newValue);
  };

  return (
    <div className="pb-3">
      {label && (
        <label htmlFor={"rate"} className="mb-2.5 block text-black dark:text-white">
          {label} {required && <span className="text-meta-1">*</span>}
        </label>
      )}

      <div className="flex" id="rate">
        {[1, 2, 3, 4, 5].map((index) => (
          <div
            className="cursor-pointer"
            onClick={() => {
              handleClick(index);
            }}
          >
            <StarIconComponent
              key={index}
              width={23}
              height={23}
              selected={index <= value ? true : false}
            />
          </div>
        ))}
      </div>
    </div>
      
  );
};

export default Rating;
