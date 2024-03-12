import React from "react";

function DescriptionPanel({ description, title }) {
  return (
    <div className="description-panel">
      {title && <h2>{title}</h2>}
      {description && (
        <div className="description-paragraph">{description}</div>
      )}
    </div>
  );
}

export default DescriptionPanel;
