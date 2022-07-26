import React from "react";
import "./style.scss";

const JMP = () => {
  return (
    <div
      className="widget-wrap"
      id="widget-jmp"
      style={{
        height: 500,
        justifyContent: "center",
        display: "flex",
        alignItems: "center",
      }}
    >
      <h3 style={{ color: "#ccc" }}>- JMP Charts -</h3>
    </div>
  );
};

export default React.memo(JMP);
