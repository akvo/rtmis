import React, { useState, useEffect } from "react";
import "./style.scss";
import { Spin } from "antd";
import { LoadingOutlined } from "@ant-design/icons";
import { api } from "../../lib";
import { useNotification } from "../../util/hooks";
import { Chart } from "../../components";
import PropTypes from "prop-types";

const DataChart = ({ formId, questionId, title, type = "BAR", stack }) => {
  const [dataset, setDataset] = useState([]);
  const [loading, setLoading] = useState(false);
  const { notify } = useNotification();

  useEffect(() => {
    if (formId && questionId) {
      setLoading(true);
      const url =
        type === "BARSTACK" && stack?.id
          ? `chart/data/${formId}?question=${questionId}&stack=${stack.id}`
          : `chart/data/${formId}?question=${questionId}`;
      api
        .get(url)
        .then((res) => {
          setDataset(res.data.data);
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
  }, [formId, questionId, notify, type, stack]);

  const chartTitle = type === "BARSTACK" ? title[0] : title;

  return (
    <div className="chart-wrap">
      <h3>{chartTitle}</h3>
      <div className="chart-inner">
        {loading ? (
          <Spin
            indicator={<LoadingOutlined style={{ color: "#1b91ff" }} spin />}
          />
        ) : (
          <Chart span={24} type={type} data={dataset} wrapper={false} />
        )}
      </div>
    </div>
  );
};

DataChart.propTypes = {
  formId: PropTypes.number.isRequired,
  questionId: PropTypes.number.isRequired,
  type: PropTypes.string,
  title: PropTypes.string,
  stack: PropTypes.object,
};
export default React.memo(DataChart);
