
import React from "react";
import GlobalChat from "./GlobalChat";

function Feed({ feed }) {

  if (!feed || feed.length === 0) {
    return (
      <div style={{ marginBottom: "32px" }}>
        <div>No hay textos completos disponibles en el feed.</div>
      </div>
    );
  }


  return (
    <div style={{ marginBottom: "32px" }}>
      {/* Chat Global */}
      <GlobalChat />
    </div>
  );
}

export default Feed;