import React, { useState, useEffect } from "react";
import "./style.scss";
import { Spin } from "antd";
import { LoadingOutlined } from "@ant-design/icons";
import { api } from "../../lib";
import { useNotification } from "../../util/hooks";
import { Chart } from "../../components";
import PropTypes from "prop-types";
import { Color } from "../../components/chart/options/common";

const DataChart = ({ config, formId }) => {
  const [dataset, setDataset] = useState([]);
  const [chartColors, setChartColors] = useState([]);
  const [loading, setLoading] = useState(false);
  const { notify } = useNotification();
  const { id, title, type, stack, options } = config;
  useEffect(() => {
    if (formId && id) {
      setLoading(true);
      const url =
        type === "BARSTACK" && stack?.id
          ? `chart/data/${formId}?question=${id}&stack=${stack.id}`
          : `chart/data/${formId}?question=${id}`;
      api
        .get(url)
        .then((res) => {
          const colors = [];
          const temp = options?.length
            ? res.data?.data?.map((d, dI) => {
                let optRes;
                if (type === "BARSTACK") {
                  optRes = stack?.options.find(
                    (op) => op.name.toLowerCase() === d.group.toLowerCase()
                  );
                  colors.push(optRes?.color || Color.color[dI]);
                  return {
                    name: optRes?.title || optRes?.name || d.name,
                    stack: d.child.map((dc, dcI) => {
                      const stackRes = options.find(
                        (sO) => sO.name.toLowerCase() === dc.name.toLowerCase()
                      );
                      if (stackRes) {
                        return {
                          name: stackRes?.title || stackRes?.name || dc.name,
                          value: dc.value,
                          color: stackRes.color || Color.color[dcI],
                        };
                      }
                    }),
                  };
                }
                optRes = options.find(
                  (op) => op.name.toLowerCase() === d.name.toLowerCase()
                );
                colors.push(optRes?.color || Color.color[dI]);
                return {
                  name: optRes?.title || optRes?.name || d.name,
                  value: d.value,
                };
              })
            : res.data.data;
          setChartColors(colors);
          setDataset(temp);
          setLoading(false);
        })
        .catch(() => {
          notify({
            type: "error",
            message: "Could not load data",
          });
          setLoading(false);
        });
    }
  }, [formId, id, notify, type, stack, options]);
  const chartTitle =
    type === "BARSTACK" ? [title, stack.title].join(" - ") : title;

  return (
    <div className="chart-wrap">
      <h3>{chartTitle}</h3>
      <div className="chart-inner">
        {loading ? (
          <Spin
            indicator={<LoadingOutlined style={{ color: "#1b91ff" }} spin />}
          />
        ) : (
          <Chart
            span={24}
            type={type}
            data={dataset}
            wrapper={false}
            extra={{ color: chartColors.length ? chartColors : Color.color }}
          />
        )}
      </div>
    </div>
  );
};

DataChart.propTypes = {
  formId: PropTypes.number.isRequired,
  config: PropTypes.shape({
    id: PropTypes.number.isRequired,
    type: PropTypes.string.isRequired,
    title: PropTypes.string,
    stack: PropTypes.any,
    options: PropTypes.array,
  }),
};
export default React.memo(DataChart);
