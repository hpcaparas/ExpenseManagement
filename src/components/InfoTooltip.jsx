import React, { useState } from "react";

const InfoTooltip = ({ message }) => {
  const [show, setShow] = useState(false);

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={() => setShow(!show)}
        className="text-blue-500 ml-2 cursor-pointer"
        title="Click for info"
      >
        ℹ️
      </button>
      {show && (
        <div className="absolute z-10 bg-white border border-gray-300 p-2 rounded shadow w-64 top-full left-1/2 transform -translate-x-1/2 mt-2 text-sm">
          {message}
        </div>
      )}
    </div>
  );
};

export default InfoTooltip;
