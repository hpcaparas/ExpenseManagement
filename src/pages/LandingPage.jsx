import Lottie from "lottie-react";
import animationData from "../images/lottie/lottie-home.json"; // ✅ Load Lottie JSON

const LandingPage = () => {
  return (
    <div className="flex flex-col h-screen w-full overflow-hidden">
      {/* Main Content Wrapper (Prevents Overlapping Sidebar) */}
      <div className="flex-1 relative flex items-center justify-center">
        {/* Lottie Animation - Restricted to Main Content */}
        <div className="w-full h-full max-w-screen-lg mx-auto flex items-center justify-center z-0">
          <Lottie animationData={animationData} className="w-full h-auto max-h-[90vh]" />
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
