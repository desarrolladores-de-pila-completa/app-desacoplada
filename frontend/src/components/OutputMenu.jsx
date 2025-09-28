import React from "react";

function OutputMenu({ outputMsg, outputType, outputMinimized, toggleOutputMinimize }) {
  if (!outputMsg) return null;
  return (
    <div className={`output-menu ${outputType} ${outputMinimized ? "minimized" : ""}`} style={{ position: "fixed", left: 0, bottom: 0, width: "100vw", zIndex: 1200, pointerEvents: "none" }}>
      <div id="output-menu" style={{ width: "100vw", maxWidth: "480px", margin: "0 auto", background: "#fff", color: "#222", boxShadow: "0 -4px 24px #0004", borderRadius: "16px 16px 0 0", padding: "24px 16px 32px 16px", position: "relative", bottom: outputMinimized ? "-120px" : 0, opacity: outputMinimized ? 0.5 : 1, transition: "bottom 0.3s, opacity 0.3s", pointerEvents: "auto" }}>
        <button id="output-min-btn" style={{ position: "absolute", right: "12px", top: "16px", background: "transparent", color: "#222", border: "none", borderRadius: "50%", padding: 0, width: "16px", height: "16px", fontSize: "1em", cursor: "pointer", pointerEvents: "auto", boxShadow: "none", display: outputMinimized ? "none" : "flex", alignItems: "center", justifyContent: "center" }} onClick={toggleOutputMinimize}>
          <span id="output-arrow-hide" style={{ display: "inline", fontSize: "16px", color: "#222", width: "16px", height: "16px", lineHeight: "16px", textAlign: "center" }}>&#x25BC;</span>
        </button>
        <button id="output-restore-btn" style={{ position: "fixed", left: "50%", transform: "translateX(-50%)", bottom: 0, zIndex: 1300, background: "#eee", color: "#222", border: "none", borderRadius: "16px 16px 0 0", padding: "6px 18px", fontSize: "1.7em", cursor: "pointer", boxShadow: "0 -2px 8px #0002", display: outputMinimized ? "block" : "none" }} onClick={toggleOutputMinimize}>
          <span id="output-arrow-show" style={{ fontSize: "1em", color: "#222" }}>&#x25B2;</span>
        </button>
        <div id="output-area" style={{ minHeight: "32px", fontSize: "1em", color: outputType === "success" ? "green" : outputType === "error" ? "red" : "orange", marginTop: "8px" }}>
          {outputMsg}
        </div>
      </div>
    </div>
  );
}

export default OutputMenu;