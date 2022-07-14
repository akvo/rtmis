import React, { useMemo } from "react";
import { Row, Col, Card, Image } from "antd";
import { get, sum } from "lodash";
import millify from "millify";

const cardColorPalette = [
  "#CBBFFF",
  "#FFDBBF",
  "#BFD5FF",
  "#FFF8BF",
  "#99BF9A",
  "#BFF7FF",
  "#F1DBB5",
];

const CardVisual = ({ cardConfig, loading }) => {
  const {
    title,
    type,
    path,
    calc,
    span,
    data,
    index,
    color,
    icon,
    lastUpdate,
    admLevelName,
  } = cardConfig;

  const renderData = useMemo(() => {
    if (!path || !data.length) {
      return {
        title: title,
        value: "-",
      };
    }
    const transform = data.map((d) => get(d, path));
    if (calc === "sum") {
      const sums = sum(transform);
      return {
        title: title,
        value: sums > 100 ? millify(sums) : sums,
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
      <Card
        style={{
          backgroundColor: color || cardColorPalette?.[index] || "#fff",
        }}
      >
        <Row gutter={[10, 10]} align="top" justify="space-between">
          <Col flex={icon ? "60%" : "100%"}>
            <h3>
              {renderData?.title?.replace(
                "##administration_level##",
                admLevelName?.plural
              )}
            </h3>
          </Col>
          {icon && (
            <Col flex="40%" align="end">
              <Image
                src={`/assets/dashboard/${icon}`}
                width={50}
                preview={false}
                alt={icon}
              />
            </Col>
          )}
        </Row>
        <h1>{!loading && renderData?.value}</h1>
        <h4>Last Update : {loading ? "Loading..." : lastUpdate}</h4>
      </Card>
    </Col>
  );
};

export default CardVisual;
