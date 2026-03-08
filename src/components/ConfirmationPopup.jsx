import React from "react";
import { FiAlertTriangle } from "react-icons/fi";

const ConfirmationPopup = ({ message, onConfirm, onCancel }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_25px_60px_rgba(15,23,42,0.25)] animate-[fadeIn_.15s_ease-out]">
        
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-600">
            <FiAlertTriangle className="text-xl" />
          </div>

          <div className="flex-1">
            <h3 className="text-lg font-semibold text-slate-900">
              Confirmation Required
            </h3>
            <p className="mt-1 text-sm text-slate-600">
              {message}
            </p>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
          >
            Cancel
          </button>

          <button
            onClick={onConfirm}
            className="rounded-xl bg-gradient-to-r from-red-600 to-rose-600 px-4 py-2 text-sm font-semibold text-white shadow-[0_10px_25px_rgba(239,68,68,0.35)] transition hover:-translate-y-0.5 hover:shadow-[0_14px_30px_rgba(239,68,68,0.45)]"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationPopup;
