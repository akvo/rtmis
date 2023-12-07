import React from "react";

function DescriptionPanel({ description, title }) {
  if (!description) {
    return "";
  }
  return (
    <div className="description-panel">
      {title && <h2>{title}</h2>}
      <div className="description-paragraph">{description}</div>
    </div>
  );
}

export default DescriptionPanel;
