import React from "react";

const AuthLayout = ({ children, leftSideContent }) => {
  return (
    <div className="flex w-full h-screen overflow-hidden">
      {/* Left side - Dark background with text */}
      <div className="relative w-1/2 bg-black flex items-center justify-center">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-30 blur-sm"
          style={{
            backgroundImage:
              "url(https://uploadthingy.s3.us-west-1.amazonaws.com/qBc87rPwb2G3LNweHucLSz/SmartSelect_20250826-172418_Chrome.jpg)",
          }}
        ></div>
        <div className="relative z-10">
          <h1 className="text-6xl font-light text-gray-300 transition-opacity duration-500">
            {leftSideContent}
          </h1>
        </div>
      </div>
      {/* Right side - Form container */}
      <div className="w-1/2 bg-gray-100 flex items-center justify-center p-8 transition-all duration-500 ease-in-out">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  );
};


export default AuthLayout;