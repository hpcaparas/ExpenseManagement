import React, { useState, useRef } from "react";

const ReceiptModal = ({ imageUrl, onClose }) => {
  const [scale, setScale] = useState(1); // Zoom level
  const [position, setPosition] = useState({ x: 0, y: 0 }); // Image position
  const imgRef = useRef(null);
  const containerRef = useRef(null);

  const handleDownload = async () => {
    try {
      const response = await fetch(imageUrl, { mode: "cors" }); // Ensure CORS is allowed
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = imageUrl.split("/").pop() || "downloaded-image.jpg"; // Extract filename or set default
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Cleanup
      URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error("Error downloading image:", error);
      alert("Failed to download image. Please try again.");
    }
  };
  // Zoom in/out with mouse scroll
  const handleWheelZoom = (e) => {
    e.preventDefault();
    const zoomAmount = e.deltaY > 0 ? -0.1 : 0.1;
    setScale((prevScale) => Math.min(Math.max(prevScale + zoomAmount, 1), 3)); // Limit zoom from 1x to 3x
  };

  // Handle drag to move image when zoomed in
  const handleMouseDown = (e) => {
    if (scale === 1) return; // No drag if zoom is 1x

    const startX = e.clientX;
    const startY = e.clientY;
    const startPos = { ...position };

    const handleMouseMove = (moveEvent) => {
      const dx = moveEvent.clientX - startX;
      const dy = moveEvent.clientY - startY;

      setPosition({
        x: Math.max(-200, Math.min(200, startPos.x + dx)), // Limit movement
        y: Math.max(-200, Math.min(200, startPos.y + dy)),
      });
    };

    const handleMouseUp = () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  };

  // Zoom with pinch on touch devices
  const handleTouchStart = (e) => {
    if (e.touches.length !== 2) return;
    const [touch1, touch2] = e.touches;
    const startDistance = Math.hypot(
      touch2.clientX - touch1.clientX,
      touch2.clientY - touch1.clientY
    );

    const handleTouchMove = (moveEvent) => {
      if (moveEvent.touches.length !== 2) return;
      const [newTouch1, newTouch2] = moveEvent.touches;
      const newDistance = Math.hypot(
        newTouch2.clientX - newTouch1.clientX,
        newTouch2.clientY - newTouch1.clientY
      );
      const zoomFactor = newDistance / startDistance;
      setScale((prevScale) => Math.min(Math.max(prevScale * zoomFactor, 1), 3));
    };

    const handleTouchEnd = () => {
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
    };

    window.addEventListener("touchmove", handleTouchMove);
    window.addEventListener("touchend", handleTouchEnd);
  };

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-60 z-[9999]"
      onWheel={handleWheelZoom}
    >
      <div className="relative bg-white p-4 rounded-lg shadow-lg max-w-3xl w-full">
        {/* Close Button */}
        <button
          className="absolute top-2 right-2 bg-gray-700 text-white rounded-full px-3 py-1 text-lg hover:bg-gray-900 z-[99999]"
          onClick={onClose}
        >
          ✕
        </button>

        {/* Image with Zoom & Drag */}
        <div
          className="flex justify-center items-center overflow-hidden"
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
        >
          <img
            ref={imgRef}
            src={imageUrl}
            alt="Receipt Preview"
            className="cursor-grab"
            style={{
              transform: `scale(${scale}) translate(${position.x}px, ${position.y}px)`,
              transition: "transform 0.1s ease-out",
              maxWidth: "100%",
              maxHeight: "80vh",
              objectFit: "contain",
            }}
          />
        </div>
        
        {/* Zoom Controls */}
        <div className="flex justify-center mt-4 space-x-4">
          {/* Download Button */}
          <button
            onClick={handleDownload}
            className="bg-white text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            ⬇️
            <span className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-max bg-black text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity">
              Download Image
            </span>
          </button>
          <button
            onClick={() => setScale((prev) => Math.min(prev + 0.2, 3))}
            className="bg-white text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            ➕
            <span className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-max bg-black text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity">
              Zoom In
            </span>
          </button>
          <button
            onClick={() => setScale((prev) => Math.max(prev - 0.2, 1))}
            className="bg-white text-white px-4 py-2 rounded hover:bg-gray-700"
          >
            ➖
            <span className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-max bg-black text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity">
              Zoom Out
            </span>
          </button>
          <button
            onClick={() => {
              setScale(1);
              setPosition({ x: 0, y: 0 });
            }}
            className="bg-red-500 text-red px-4 py-2 rounded hover:bg-red-700"
          >
            🔄 Reset
            <span className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-max bg-black text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity">
              Reset Zoom
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReceiptModal;
