import React, { useMemo } from "react";
import { Col, Card } from "antd";
import { get, sum } from "lodash";

const CardVisual = ({ config, dataset }) => {
  const { title, path, calculation, span } = config;

  const data = useMemo(() => {
    if (!path || !dataset.length) {
      return {
        title: title,
        value: "-",
      };
    }
    const transform = dataset.map((d) => get(d, path));
    if (calculation === "sum") {
      return {
        title: title,
        value: sum(transform),
      };
    }
    if (calculation === "count" && path === "length") {
      return {
        title: title,
        value: dataset.length,
      };
    }
    if (calculation === "percent") {
      const totalData = sum(dataset.map((d) => d.total));
      const sumLevel = sum(transform);
      const percent = (sumLevel / totalData) * 100;
      return {
        title: title,
        value: `${percent}%`,
      };
    }
  }, [dataset, calculation, path, title]);

  return (
    <Col
      key={`col-${title}`}
      align="center"
      justify="space-between"
      span={span}
    >
      <Card>
        <h3>{data?.title}</h3>
        <h1>{data?.value}</h1>
      </Card>
    </Col>
  );
};

export default CardVisual;
