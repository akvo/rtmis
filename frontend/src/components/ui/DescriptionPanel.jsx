import React from "react";

function DescriptionPanel({ description }) {
  return (
    <div>
      {description && (
        <span className="description-paragraph" style={{ color: "green" }}>
          {description}
        </span>
      )}
    </div>
  );
}

export default DescriptionPanel;
