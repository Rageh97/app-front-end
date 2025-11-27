import React, { useState, useEffect } from "react";
import FormModal from "./FormModal";
import { ModalProps } from "@/types/modal-props";
import Button from "@/components/buttons/Button";

type Props = ModalProps & {
  currentDate?: string;
  onConfirm?: (newDate: string) => void;
  title?: string;
  isLoading?: boolean;
};

export const getEditExpiryModal = (props: Omit<Props, "open" | "onClose"> = {}) => {
  return (modalProps: ModalProps) => (
    <EditExpiryModal {...props} {...modalProps} />
  );
};

const EditExpiryModal: React.FC<Props> = ({
  open,
  onClose,
  currentDate,
  onConfirm,
  title,
  isLoading,
  additionalProps,
}) => {
  const effectiveCurrentDate = additionalProps?.currentDate || currentDate;
  const effectiveOnConfirm = additionalProps?.onConfirm || onConfirm;
  const effectiveTitle = additionalProps?.title || title;
  const effectiveIsLoading = additionalProps?.isLoading !== undefined ? additionalProps?.isLoading : isLoading;

  // Initialize state with currentDate formatted as YYYY-MM-DD
  const [date, setDate] = useState("");

  useEffect(() => {
    if (effectiveCurrentDate) {
      try {
        const d = new Date(effectiveCurrentDate);
        if (!isNaN(d.getTime())) {
             setDate(d.toISOString().split('T')[0]);
        }
      } catch (e) {
        console.error("Invalid date:", effectiveCurrentDate);
      }
    }
  }, [effectiveCurrentDate, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Append time to keep it consistent or just send the date part if backend handles it.
    // Backend expects a Date object or string.
    // Let's send ISO string with current time or T23:59:59
    const newDate = new Date(date);
    newDate.setHours(23, 59, 59, 999); // Set to end of day
    if (effectiveOnConfirm) {
      effectiveOnConfirm(newDate.toISOString());
    }
    onClose();
  };

  return (
    <FormModal open={open} onClose={onClose} title={effectiveTitle || "Edit Expiry"}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="mb-2.5 block text-black dark:text-white">
            تغيير تاريخ الانتهاء
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
            required
          />
        </div>
        <div className="flex justify-end gap-4 mt-4">
          <Button
            onClick={onClose}
            buttonType="Secondary"
            className="bg-red"
            type="button"
          >
            إلغاء
          </Button>
          <Button
            type="submit"
            buttonType="Primary"
            isLoading={effectiveIsLoading}
          >
            حفظ
          </Button>
        </div>
      </form>
    </FormModal>
  );
};

export default EditExpiryModal;
