import React, { useMemo } from "react";
import { Row, Col, Card, Image } from "antd";
import { get, sum, mean, takeRight } from "lodash";
import millify from "millify";
import { api, store } from "../../../lib";

const cardColorPalette = [
  "#CBBFFF",
  "#FFDBBF",
  "#BFD5FF",
  "#FFF8BF",
  "#99BF9A",
  "#BFF7FF",
  "#F1DBB5",
];

const CardVisual = ({ cardConfig, loading, customTotal = false }) => {
  const {
    title,
    type,
    path,
    calc,
    scale,
    data,
    index,
    suffix,
    color,
    icon,
    lastUpdate,
    admLevelName,
  } = cardConfig;
  const administration = store.useState((s) => s.administration);
  const currentAdministration = takeRight(administration)?.[0];

  const renderData = useMemo(() => {
    if (!path || !data.length) {
      return {
        title: title,
        value: "-",
      };
    }
    let result = {
      title: title,
      value: 0,
    };
    const transform = data.map((d) => get(d, path));
    if (calc === "sum") {
      const sums = sum(transform);
      result = {
        title: title,
        value: sums > 100 ? millify(sums) : sums,
      };
    }
    if (calc === "count" && path === "length") {
      api.get(`administrations/${currentAdministration.id}`).then((res) => {
        const filterAdm = res.children;
        // counties count card
        const administration_count = filterAdm.length || 1;
        // filter data by total > 0
        const administration_reported = data.filter((d) => d.total > 0).length;
        const adm_percent = Math.round(
          (administration_reported / administration_count) * 100
        );
        result = {
          title: title,
          value: `${administration_reported} (${adm_percent}%)`,
        };
      });
    }
    if (calc === "tail") {
      result = {
        title: title,
        value: data.length ? millify(takeRight(data)[0][path]) : 0,
      };
    }
    if (calc === "percent") {
      const totalData = customTotal || sum(data.map((d) => d.total));
      const sumLevel = sum(transform);
      const percent = Math.round((sumLevel / totalData) * 100);
      result = {
        title: title,
        value: `${!isNaN(percent) ? percent : 0}%`,
      };
    }
    if (calc === "avg") {
      const avg = mean(transform);
      result = {
        title: title,
        value: avg.toFixed(2),
      };
    }
    if (scale) {
      const percentage = ((result.value / scale) * 100)?.toFixed(2);
      result = {
        ...result,
        value: `${result.value} (${percentage} %)`,
      };
    }
    if (suffix) {
      result = {
        ...result,
        value: `${result.value} ${suffix}`,
      };
    }
    return result;
  }, [
    data,
    calc,
    path,
    title,
    scale,
    suffix,
    customTotal,
    currentAdministration,
  ]);

  return (
    <Col
      key={`col-${type}-${index}`}
      className="flexible-columns overview-card"
      align="center"
      justify="space-between"
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
                height={60}
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
