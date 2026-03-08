import React, { useState, useRef } from "react";
import {
  FiX,
  FiDownload,
  FiZoomIn,
  FiZoomOut,
  FiRotateCcw,
  FiImage,
} from "react-icons/fi";

const ReceiptModal = ({ imageUrl, onClose }) => {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const imgRef = useRef(null);
  const containerRef = useRef(null);

  const resetView = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  const handleDownload = async () => {
    try {
      const response = await fetch(imageUrl, { mode: "cors" });
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = imageUrl.split("/").pop() || "receipt.jpg";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error("Error downloading image:", error);
      alert("Failed to download image. Please try again.");
    }
  };

  const handleWheelZoom = (e) => {
    e.preventDefault();
    const zoomAmount = e.deltaY > 0 ? -0.12 : 0.12;
    setScale((prevScale) => Math.min(Math.max(prevScale + zoomAmount, 1), 3));
  };

  const handleMouseDown = (e) => {
    if (scale === 1) return;

    const startX = e.clientX;
    const startY = e.clientY;
    const startPos = { ...position };

    const handleMouseMove = (moveEvent) => {
      const dx = moveEvent.clientX - startX;
      const dy = moveEvent.clientY - startY;

      setPosition({
        x: Math.max(-240, Math.min(240, startPos.x + dx)),
        y: Math.max(-240, Math.min(240, startPos.y + dy)),
      });
    };

    const handleMouseUp = () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  };

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
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm"
      onWheel={handleWheelZoom}
    >
      <div className="relative w-full max-w-6xl overflow-hidden rounded-[28px] border border-white/10 bg-slate-950 shadow-[0_30px_80px_rgba(0,0,0,0.45)]">
        <div className="flex items-center justify-between border-b border-white/10 bg-white/5 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-white">
              <FiImage className="text-lg" />
            </div>
            <div>
              <div className="text-sm font-semibold text-white">Receipt Preview</div>
              <div className="text-xs text-white/60">
                Scroll to zoom • drag when zoomed in • pinch on touch devices
              </div>
            </div>
          </div>

          <button
            className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 p-2.5 text-white/80 transition hover:bg-white/10 hover:text-white"
            onClick={onClose}
            aria-label="Close"
          >
            <FiX className="text-lg" />
          </button>
        </div>

        <div
          className="flex min-h-[60vh] items-center justify-center overflow-hidden bg-slate-950"
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
        >
          <img
            ref={imgRef}
            src={imageUrl}
            alt="Receipt Preview"
            className={`select-none object-contain ${scale > 1 ? "cursor-grab" : "cursor-default"}`}
            style={{
              transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
              transition: "transform 0.1s ease-out",
              maxWidth: "100%",
              maxHeight: "78vh",
            }}
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 bg-white/5 px-5 py-4">
          <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/70">
            Zoom: {(scale * 100).toFixed(0)}%
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <ControlButton
              icon={<FiDownload />}
              label="Download"
              onClick={handleDownload}
            />
            <ControlButton
              icon={<FiZoomIn />}
              label="Zoom In"
              onClick={() => setScale((prev) => Math.min(prev + 0.2, 3))}
            />
            <ControlButton
              icon={<FiZoomOut />}
              label="Zoom Out"
              onClick={() => setScale((prev) => Math.max(prev - 0.2, 1))}
            />
            <ControlButton
              icon={<FiRotateCcw />}
              label="Reset"
              onClick={resetView}
              variant="danger"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

function ControlButton({ icon, label, onClick, variant = "default" }) {
  const styles = {
    default:
      "border-white/10 bg-white/5 text-white/85 hover:bg-white/10 hover:text-white",
    danger:
      "border-red-400/20 bg-red-500/10 text-red-200 hover:bg-red-500/20 hover:text-white",
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-2xl border px-4 py-2.5 text-sm font-medium transition ${styles[variant]}`}
    >
      {icon}
      {label}
    </button>
  );
}

export default ReceiptModal;
