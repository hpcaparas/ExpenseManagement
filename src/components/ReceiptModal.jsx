import React from "react";

const ReceiptModal = ({ imageUrl, onClose }) => {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white p-4 rounded-lg shadow-lg relative">
        <button className="absolute top-2 right-2 text-gray-500 hover:text-gray-700" onClick={onClose}>
          ✕
        </button>
        <h2 className="text-lg font-bold mb-2">Receipt</h2>
        <img src={imageUrl} alt="Receipt" className="max-w-full max-h-[80vh] rounded-lg shadow-md" />
      </div>
    </div>
  );
};

export default ReceiptModal;
