import React, { useEffect, useRef, useState } from "react";
import ReactDOM from "react-dom/client";
import "../style.css";

const App: React.FC = () => {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [storedTopic, setStoredTopic] = useState<string>("");
  const [extensionStatus, setExtensionStatus] = useState<boolean>(false);

  useEffect(() => {
    chrome.storage.sync.get(["topic", "extensionStatus"], (result) => {
      if (result.topic) {
        setStoredTopic(result.topic);
        if (inputRef.current) {
          inputRef.current.value = result.topic;
        }
      }
      if (result.extensionStatus !== undefined) {
        setExtensionStatus(result.extensionStatus);
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

  const updateExtensionStatus = async () => {
    const newStatus = !extensionStatus;
    setExtensionStatus(newStatus);
    await chrome.storage.sync.set({ extensionStatus: newStatus });

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs[0];
      if (tab?.id && typeof tab.id === "number") {
        chrome.tabs.reload(tab.id);
      } else {
        console.warn("No active tab found");
      }
    });
  };

  useEffect(() => {
    const messageListener = (msg: any, sender: any, sendResponse: any) => {
      sendResponse({ status: "yt videos arrived" });
    };
    chrome.runtime.onMessage.addListener(messageListener);
    return () => chrome.runtime.onMessage.removeListener(messageListener);
  }, []);

  return (
    <div className="w-[320px] bg-[#0f0f0f] text-[#f1f1f1] font-sans flex flex-col shadow-2xl  overflow-hidden border border-[#272727] relative">
      {/* Sleek Header with Modern Toggle */}
      <div className="bg-gradient-to-r from-[#6466ff] to-[#8b8cff] p-5 flex items-center justify-between shadow-md relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10 mix-blend-overlay"></div>
        <h1 className="text-xl font-bold tracking-wide text-white relative z-10 drop-shadow-sm">
          Detox YT
        </h1>

        {/* Toggle Switch */}
        <div className="relative z-10 flex items-center gap-2">
          <span className="text-[11px] font-bold text-white/90 uppercase tracking-wider">
            {extensionStatus ? "ON" : "OFF"}
          </span>
          <button
            onClick={updateExtensionStatus}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-300 focus:outline-none shadow-inner ${
              extensionStatus ? "bg-white/30" : "bg-black/40"
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-300 shadow-sm ${
                extensionStatus ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>
      </div>

      {/* Main Content Body */}
      {/* If extension is off, dim the controls and disable pointer events */}
      <div
        className={`flex flex-col p-6 gap-5 bg-[#0f0f0f] transition-opacity duration-300 ${
          extensionStatus ? "opacity-100" : "opacity-40 pointer-events-none"
        }`}
      >
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
          className="w-full py-3 rounded-lg font-semibold text-white shadow-lg bg-[#6466ff] hover:bg-[#5254e5] hover:scale-[1.02] hover:shadow-[#6466ff]/30 transition-all duration-300 ease-in-out transform"
        >
          Update Focus
        </button>

        {storedTopic && (
          <p className="text-xs text-center text-[#aaaaaa] mt-1">
            Currently focused on:{" "}
            <span className="font-semibold text-[#f1f1f1]">{storedTopic}</span>
          </p>
        )}
      </div>

      {/* Floating alert when disabled */}
      {!extensionStatus && (
        <div className="absolute bottom-6 left-0 w-full flex justify-center z-20 pointer-events-none">
          <span className="bg-[#272727] text-xs px-4 py-2 rounded-full border border-[#3f3f3f] text-[#dddddd] shadow-lg">
            Detox mode is paused
          </span>
        </div>
      )}
    </div>
  );
};

const root = document.createElement("div");
// Ensure background bleeds seamlessly into the rounded corners
document.body.style.margin = "0";
document.body.style.backgroundColor = "#0f0f0f";

document.body.appendChild(root);
ReactDOM.createRoot(root).render(<App />);
