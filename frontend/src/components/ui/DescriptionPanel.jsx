import React from "react";

function DescriptionPanel({ description }) {
  if (!description) {
    return "";
  }
  return <div className="description-paragraph">{description}</div>;
}

export default DescriptionPanel;
