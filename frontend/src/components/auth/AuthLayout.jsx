import React from "react";
import { motion } from "framer-motion"; // ✅ this will now be used

const AuthLayout = ({ children, leftSideContent, darkOnRight = false }) => {
  return (
    <div className="flex w-full h-full overflow-hidden relative">
      {/* Dark Side */}
      <motion.div
        key={darkOnRight ? "right" : "left"} 
        initial={{ x: darkOnRight ? "100%" : "-100%", opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeInOut" }}
        className="absolute top-0 bottom-0 w-1/2 bg-black flex items-center justify-center"
        style={{ left: darkOnRight ? "50%" : "0%" }}
      >
        {/* Background Image */}
        <div
          className="absolute inset-0 bg-cover bg-center opacity-30 blur-sm"
          style={{
            backgroundImage:
              "url(https://uploadthingy.s3.us-west-1.amazonaws.com/qBc87rPwb2G3LNweHucLSz/SmartSelect_20250826-172418_Chrome.jpg)",
          }}
        />
        <motion.h1
          key={leftSideContent}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="relative z-10 text-6xl font-light text-gray-200 text-center"
        >
          {leftSideContent}
        </motion.h1>
      </motion.div>

      {/* Form Side */}
      <motion.div
        key={darkOnRight ? "form-left" : "form-right"}
        initial={{ opacity: 0, x: darkOnRight ? "-50px" : "50px" }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="absolute top-0 bottom-0 w-1/2 bg-gray-100 flex items-center justify-center p-8"
        style={{ left: darkOnRight ? "0%" : "50%" }}
      >
        <div className="w-full max-w-md">{children}</div>
      </motion.div>
    </div>
  );
};

export default AuthLayout;
