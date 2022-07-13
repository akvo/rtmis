import { Row, Col } from "antd";
import React from "react";

const ShapeLegend = ({
  title,
  thresholds,
  colorRange,
  shapeFilterColor,
  setShapeFilterColor,
  symbol = "",
}) => {
  const handleShapeLegendClick = (index) => {
    if (shapeFilterColor === colorRange[index]) {
      setShapeFilterColor(null);
      return;
    }
    setShapeFilterColor(colorRange[index]);
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
              {tI === 0 && `0${symbol}`}
              {tI > 0 && `${thresholds[tI - 1] + 1}${symbol}`}
              {" - "}
              {t}
              {symbol}
            </Col>
          );
        })}
      </Row>
    </div>
  );
};

export default ShapeLegend;
