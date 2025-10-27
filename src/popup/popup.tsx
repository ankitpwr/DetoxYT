import React, { useEffect, useRef } from "react";
import ReactDOM from "react-dom/client";
import "../style.css";
const App: React.FC<{}> = () => {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [storedTopic, setStoredTopic] = React.useState<string>("");

  useEffect(() => {
    chrome.storage.sync.get(["topic"], (result) => {
      if (result.topic) {
        setStoredTopic(result.topic);
        if (result && result.topic && inputRef.current) {
          inputRef.current.value = result.topic;
        }
      }
    });
  }, []);

  function handleClick() {
    const topic = inputRef.current?.value?.trim() ?? "";
    chrome.storage.sync.set({ topic }, () => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const tab = tabs[0];
        if (tab != null && tab.id != null && typeof tab.id == "number") {
          chrome.tabs.reload(tab.id);
        } else console.warn("no active tab found");
      });
    });
  }

  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    console.log("in popup message is");
    console.log(msg);
    console.log("message arrived in popup");
    sendResponse({ status: "yt videos arrived" });
  });

  return (
    <div className=" w-[300px] h-[300px]  ">
      <div className="bg-[#6466ff] h-12 flex items-center px-2">
        <h1 className="text-xl font-semibold text-white">Detox YT</h1>
      </div>

      <div className="w-full flex flex-col p-2 items-center gap-2">
        <input
          ref={inputRef}
          className="w-full px-2 py-3 text-md border-1 rounded-lg"
          placeholder="Enter topic"
          type="text"
        />
        <button
          onClick={handleClick}
          className="px-2 py-2 w-24 bg-[#6466ff] text-white rounded hover:cursor-pointer"
        >
          Start
        </button>
      </div>
    </div>
  );
};

const root = document.createElement("div");
document.body.appendChild(root);
ReactDOM.createRoot(root).render(<App />);
