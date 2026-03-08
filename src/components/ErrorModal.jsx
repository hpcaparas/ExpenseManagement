import React from "react";
import { FiAlertOctagon } from "react-icons/fi";

const ErrorModal = ({ message, onClose }) => {
  if (!message) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-[28px] border border-red-200 bg-white p-6 shadow-[0_25px_60px_rgba(15,23,42,0.25)]">
        
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-100 text-red-600">
            <FiAlertOctagon className="text-xl" />
          </div>

          <div className="flex-1">
            <h2 className="text-lg font-semibold text-red-600">
              Error
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              {message}
            </p>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="rounded-xl bg-gradient-to-r from-red-600 to-rose-600 px-4 py-2 text-sm font-semibold text-white shadow-[0_10px_25px_rgba(239,68,68,0.35)] transition hover:-translate-y-0.5 hover:shadow-[0_14px_30px_rgba(239,68,68,0.45)]"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};

export default ErrorModal;
