import React, { useState, useEffect } from "react";
import "./style.scss";
import { Spin } from "antd";
import { LoadingOutlined } from "@ant-design/icons";
import { api } from "../../lib";
import { useNotification } from "../../util/hooks";
import { Chart } from "../../components";
import PropTypes from "prop-types";
const defaultColors = [
  "#5470c6",
  "#91cc75",
  "#fac858",
  "#ee6666",
  "#73c0de",
  "#3ba272",
  "#fc8452",
  "#9a60b4",
  "#ea7ccc",
];

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
                const optRes = options.find(
                  (op) => op.name.toLowerCase() === d.name.toLowerCase()
                );
                colors.push(optRes?.color || defaultColors[dI]);
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

  return (
    <div className="chart-wrap">
      <h3>{title}</h3>
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
            extra={{ color: chartColors.length ? chartColors : defaultColors }}
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
