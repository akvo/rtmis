import React, { useMemo } from "react";
import { Col, Card, Image } from "antd";
import { get, sum } from "lodash";

const CardVisual = ({ cardConfig }) => {
  const { title, type, path, calc, span, data, index, color, icon } =
    cardConfig;

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
      className="overview-card"
      align="center"
      justify="space-between"
      span={span}
    >
      <Card style={{ backgroundColor: color || "#fff" }}>
        {icon && (
          <Image
            src={`/assets/dashboard/${icon}`}
            width={48}
            preview={false}
            alt={icon}
          />
        )}
        <h3 className={icon ? "with-icon" : ""}>{renderData?.title}</h3>
        <h1 className={icon ? "with-icon" : ""}>{renderData?.value}</h1>
      </Card>
    </Col>
  );
};

export default CardVisual;
