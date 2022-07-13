import React, { useEffect, useMemo, useState } from "react";
import { Col, Card } from "antd";
import { get, capitalize, chain, groupBy, sumBy } from "lodash";
import { Chart } from "../../../components";

const exampleTrendChartData = [
  { name: "Mon", value: 820 },
  { name: "Tue", value: 932 },
  { name: "Wed", value: 901 },
  { name: "Thu", value: 934 },
  { name: "Fri", value: 1290 },
  { name: "Sat", value: 1330 },
  { name: "Sun", value: 1320 },
];

const ChartVisual = ({ chartConfig }) => {
  const { title, type, span, data, index, path, api } = chartConfig;
  const [chartDataApi, setChartDatApi] = useState([]);

  const chartData = useMemo(() => {
    if (!path && api && !data.length) {
      return [];
    }
    const transform = data
      .map((d) => {
        const obj = get(d, path);
        if (!obj) {
          return false;
        }
        return Object.keys(obj).map((key) => ({
          name: capitalize(key),
          value: obj[key],
        }));
      })
      .filter((x) => x)
      .flatMap((x) => x);
    return chain(groupBy(transform, "name"))
      .map((g, gi) => ({
        name: gi,
        value: sumBy(g, "value"),
      }))
      .value();
  }, [data, path, api]);

  useEffect(() => {
    if (api && !path) {
      setChartDatApi(exampleTrendChartData);
    }
  }, [api, path]);

  return (
    <Col key={`col-${type}-${index}`} span={span}>
      <Card>
        <h3>{title}</h3>
        {!path && api ? (
          <Chart
            height={50 * chartDataApi.length + 188}
            type="LINEAREA"
            data={chartDataApi}
            wrapper={false}
            horizontal={true}
            loading={!chartDataApi.length}
            series={{
              left: "10%",
            }}
            legend={{
              top: "middle",
              left: "65%",
              right: "right",
              orient: "vertical",
              itemGap: 12,
              textStyle: {
                fontWeight: "normal",
                fontSize: 12,
              },
            }}
            grid={{
              top: 90,
              left: 120,
            }}
          />
        ) : (
          <Chart
            height={50 * chartData.length + 188}
            type="BAR"
            data={chartData}
            wrapper={false}
            horizontal={true}
            loading={!chartData.length}
            series={{
              left: "10%",
            }}
            legend={{
              top: "middle",
              left: "65%",
              right: "right",
              orient: "vertical",
              itemGap: 12,
              textStyle: {
                fontWeight: "normal",
                fontSize: 12,
              },
            }}
            grid={{
              top: 90,
              left: 120,
            }}
          />
        )}
      </Card>
    </Col>
  );
};

export default ChartVisual;
