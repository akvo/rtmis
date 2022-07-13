import React, { useMemo } from "react";
import { Col, Card } from "antd";
import { get, capitalize, chain, groupBy, sumBy } from "lodash";
import { Chart } from "../../../components";

const ChartVisual = ({ chartConfig }) => {
  // TODO:: set api config for trend chart
  const { title, type, span, data, index, path } = chartConfig;

  const chartData = useMemo(() => {
    if (!path && !data.length) {
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
  }, [data, path]);

  return (
    <Col key={`col-${type}-${index}`} span={span}>
      <Card>
        <h3>{title}</h3>
        {!path ? (
          <h4>No data</h4>
        ) : (
          <Chart
            height={50 * chartData.length + 188}
            type="BAR"
            data={chartData}
            wrapper={false}
            horizontal={true}
            loading={!chartData.length}
            // extra={{ color: chartColors, animation: next === index + 1 }}
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
