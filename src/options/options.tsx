import React, { useEffect } from "react";
import ReactDOM from "react-dom/client";

const Option: React.FC<{}> = () => {
  return (
    <div className=" w-[300px] h-[400px] ">
      <h1 className="bg-red-600">Detox YT option page</h1>
    </div>
  );
};

const root = document.createElement("div");
document.body.appendChild(root);
ReactDOM.createRoot(root).render(<Option />);
