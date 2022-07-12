import React, { useMemo } from "react";
import { Col, Card } from "antd";
import { get, sum } from "lodash";

const CardVisual = ({ config }) => {
  const { title, type, path, calc, span, data, index } = config;

  const renderData = useMemo(() => {
    if (!path || !data.length) {
      return {
        title: title,
        value: "-",
      };
    }
    const transform = data.map((d) => get(d, path));
    if (calc === "sum") {
      return {
        title: title,
        value: sum(transform),
      };
    }
    if (calc === "count" && path === "length") {
      return {
        title: title,
        value: data.length,
      };
    }
    if (calc === "percent") {
      const totalData = sum(data.map((d) => d.total));
      const sumLevel = sum(transform);
      const percent = (sumLevel / totalData) * 100;
      return {
        title: title,
        value: `${percent.toFixed(2)}%`,
      };
    }
  }, [data, calc, path, title]);

  return (
    <Col
      key={`col-${type}-${index}`}
      align="center"
      justify="space-between"
      span={span}
    >
      <Card>
        <h3>{renderData?.title}</h3>
        <h1>{renderData?.value}</h1>
      </Card>
    </Col>
  );
};

export default CardVisual;
