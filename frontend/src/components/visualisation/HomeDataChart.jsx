import React, { useState, useEffect } from "react";
import "./style.scss";
import { Card, Spin } from "antd";
import { LoadingOutlined, SwapOutlined } from "@ant-design/icons";
import { api, queue } from "../../lib";
import { useNotification } from "../../util/hooks";
import { Chart } from "../../components";
import PropTypes from "prop-types";
import { Color } from "../../components/chart/options/common";

const HomeDataChart = ({ config, formId, index }) => {
  const [dataset, setDataset] = useState([]);
  const [chartColors, setChartColors] = useState([]);
  const { notify } = useNotification();
  const { id, title, type, stack, options, horizontal = true } = config;

  const { next, wait } = queue.useState((q) => q);
  const runCall = index === next && !wait;
  const loading = index <= next;

  const getOptionColor = (name, index) => {
    return (
      Color.option.find((c) => {
        const lookUp = name?.toLowerCase();
        return lookUp
          ? c.keys?.some((keyStr) => keyStr.toLowerCase() === lookUp)
          : false;
      })?.color || Color.color[index]
    );
  };

  useEffect(() => {
    if (formId && id && runCall) {
      const url =
        type === "BARSTACK" && stack?.id
          ? `chart/overview/${formId}?question=${id}&stack=${stack.id}`
          : `chart/overview/${formId}?question=${id}`;
      api
        .get(url)
        .then((res) => {
          const colors = [];
          const temp = res.data?.data?.map((d, dI) => {
            if (type === "BARSTACK" && stack) {
              const optRes = stack?.options?.find(
                (op) => op.name.toLowerCase() === d.group.toLowerCase()
              );
              colors.push(optRes?.color || getOptionColor(d.group, dI));
              return {
                name: d.group,
                title: optRes?.title || d.group,
                stack: d.child.map((dc, dcI) => {
                  const stackRes = options?.find(
                    (sO) => sO.name.toLowerCase() === dc.name.toLowerCase()
                  );
                  return {
                    name: dc.name,
                    title: stackRes?.title || dc.name,
                    value: dc.value,
                    color: stackRes?.color || getOptionColor(dc.name, dcI),
                  };
                }),
              };
            }
            if (options?.length) {
              const optRes =
                options?.find(
                  (op) => op.name.toLowerCase() === d.name.toLowerCase()
                ) || null;
              colors.push(optRes?.color || getOptionColor(d.name, dI));
              return {
                name: optRes?.title || optRes?.name || d.name,
                value: d.value,
              };
            }
            colors.push(getOptionColor(d.name, dI));
            return d;
          });
          setChartColors(colors);
          setDataset(temp);
        })
        .catch(() => {
          notify({
            type: "error",
            message: "Could not load data",
          });
        })
        .finally(() => {
          queue.update((q) => {
            q.next = index + 1;
          });
        });
    }
  }, [formId, id, index, notify, type, stack, options, runCall]);

  const chartTitle =
    type === "BARSTACK" ? (
      <h3>
        {title}
        <SwapOutlined />
        {stack.title}
      </h3>
    ) : (
      <h3>{title}</h3>
    );

  return (
    <Card className="chart-wrap">
      {chartTitle}
      <div className="chart-inner">
        {loading ? (
          <Spin
            indicator={<LoadingOutlined style={{ color: "#1b91ff" }} spin />}
          />
        ) : (
          <Chart
            height={type === "PIE" ? 290 : 50 * dataset.length + 188}
            type={type}
            data={dataset}
            wrapper={false}
            horizontal={horizontal}
            extra={{ color: chartColors, animation: false }}
            series={
              type === "PIE"
                ? {
                    left: "5%",
                    right: "27%",
                    top: "middle",
                    radius: "85",
                  }
                : {
                    left: "10%",
                  }
            }
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
          />
        )}
      </div>
    </Card>
  );
};

HomeDataChart.propTypes = {
  formId: PropTypes.number.isRequired,
  config: PropTypes.shape({
    id: PropTypes.number.isRequired,
    type: PropTypes.string.isRequired,
    title: PropTypes.string,
    stack: PropTypes.any,
    options: PropTypes.array,
  }),
};
export default React.memo(HomeDataChart);
