import React, { useEffect, useRef, useState } from "react";
import ReactDOM from "react-dom/client";
import "../style.css";

const App: React.FC = () => {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [storedTopic, setStoredTopic] = useState<string>("");
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    chrome.storage.sync.get(["topic"], (result) => {
      if (result.topic) {
        setStoredTopic(result.topic);
        if (inputRef.current) {
          inputRef.current.value = result.topic;
        }
      }
    });
  }, []);

  async function handleClick() {
    const topic = inputRef.current?.value?.trim() ?? "";
    await chrome.storage.sync.set({ topic });
    await chrome.runtime.sendMessage({ type: "Related_Topic", topic: topic });

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs[0];
      if (tab?.id && typeof tab.id === "number") {
        chrome.tabs.reload(tab.id);
      } else {
        console.warn("No active tab found");
      }
    });
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleClick();
    }
  };

  useEffect(() => {
    const messageListener = (msg: any, sender: any, sendResponse: any) => {
      console.log("Message arrived in popup:", msg);
      sendResponse({ status: "yt videos arrived" });
    };
    chrome.runtime.onMessage.addListener(messageListener);
    return () => chrome.runtime.onMessage.removeListener(messageListener);
  }, []);

  return (
    <div className="w-[320px] bg-[#0f0f0f] text-[#f1f1f1] font-sans flex flex-col shadow-2xl   overflow-hidden border border-[#272727]">
      <div className="bg-gradient-to-r from-[#6466ff] to-[#8b8cff] p-5 flex items-center justify-center shadow-md relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10 mix-blend-overlay"></div>
        <h1 className="text-2xl font-bold tracking-wide text-white relative z-10 drop-shadow-sm">
          Detox YT
        </h1>
      </div>

      <div className="flex flex-col p-6 gap-5 bg-[#0f0f0f]">
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-[#aaaaaa] ml-1">
            What's your focus today?
          </label>
          <input
            ref={inputRef}
            onKeyDown={handleKeyDown}
            className="w-full px-4 py-3 bg-[#272727] text-[#f1f1f1] text-md border border-[#3f3f3f] rounded-lg outline-none focus:border-[#6466ff] focus:ring-1 focus:ring-[#6466ff] transition-all placeholder:text-[#717171]"
            placeholder="e.g. Next.js Tutorials"
            type="text"
          />
        </div>

        <button
          onClick={handleClick}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className={`w-full py-3 rounded-lg font-semibold text-white shadow-lg transition-all duration-300 ease-in-out transform ${
            isHovered
              ? "bg-[#5254e5] scale-[1.02] shadow-[#6466ff]/30"
              : "bg-[#6466ff]"
          }`}
        >
          Activate Focus Mode
        </button>

        {storedTopic && (
          <p className="text-xs text-center text-[#aaaaaa] mt-1">
            Currently focused on:{" "}
            <span className="font-semibold text-[#f1f1f1]">{storedTopic}</span>
          </p>
        )}
      </div>
    </div>
  );
};

const root = document.createElement("div");
document.body.style.margin = "0";

document.body.appendChild(root);
ReactDOM.createRoot(root).render(<App />);
