import { Row, Col } from "antd";
import React from "react";

const ShapeLegend = ({
  title,
  thresholds,
  colorRange,
  shapeFilterColor,
  setShapeFilterColor,
  calc,
}) => {
  const symbol = calc === "percent" ? "%" : "";

  const handleShapeLegendClick = (index) => {
    if (shapeFilterColor === colorRange[index]) {
      setShapeFilterColor(null);
      return;
    }
    setShapeFilterColor(colorRange[index]);
  };

  if (calc !== "percent") {
    thresholds = [...thresholds, thresholds[thresholds.length - 1]];
  }

  const renderPercent = (t, tI) => {
    let res = "";
    if (tI === 0) {
      res = `0${symbol}`;
    }
    if (tI > 0) {
      res = `${thresholds[tI - 1] + 1}${symbol}`;
    }
    return `${res} - ${t}${symbol}`;
  };

  const renderDefault = (t, tI) => {
    // check float range
    let val = thresholds[tI - 1];
    t = t % 1 !== 0 ? Math.round(t) : t;
    val = val % 1 !== 0 ? Math.round(val) : val;

    let res = "";
    if (tI === 0) {
      res = "0 - ";
    }
    if (tI >= thresholds.length - 1) {
      res = "> ";
    }
    if (tI > 0 && tI < thresholds.length - 1) {
      res = `${val + 1} - `;
    }
    return `${res} ${t}`;
  };

  return (
    <div className="shape-legend">
      <h4>{title || ""}</h4>
      <Row className="legend-wrap">
        {thresholds.map((t, tI) => {
          return (
            <Col
              key={tI}
              flex={1}
              className={`legend-item ${
                shapeFilterColor === colorRange[tI] ? "legend-selected" : ""
              }`}
              onClick={() => handleShapeLegendClick(tI)}
              style={{
                backgroundColor: colorRange[tI],
              }}
            >
              {calc === "percent" ? renderPercent(t, tI) : renderDefault(t, tI)}
            </Col>
          );
        })}
      </Row>
    </div>
  );
};

export default ShapeLegend;
