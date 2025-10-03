import React, { useEffect } from "react";
import ReactDOM from "react-dom/client";
import "../style.css";
const App: React.FC<{}> = () => {
  return (
    <div className=" w-[300px] h-[300px]  ">
      <div className="bg-[#6466ff] h-12 flex items-center px-2">
        <h1 className="text-xl font-semibold text-white">Detox YT</h1>
      </div>

      <div className="w-full flex flex-col p-2 items-center gap-2">
        <input
          className="w-full px-2 py-3 text-md border-1 rounded-lg"
          placeholder="Enter topic"
          type="text"
        />
        <button className="px-2 py-2 w-24 bg-[#6466ff] text-white rounded hover:cursor-pointer">
          Start
        </button>
      </div>
    </div>
  );
};

const root = document.createElement("div");
document.body.appendChild(root);
ReactDOM.createRoot(root).render(<App />);
