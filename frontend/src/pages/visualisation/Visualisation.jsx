import React, { useState, useEffect } from "react";
import "./style.scss";
import { Row, Col, Collapse, Space, Button, Select, Divider } from "antd";
import {
  PlusSquareOutlined,
  CloseSquareOutlined,
  BarChartOutlined,
  PieChartOutlined,
} from "@ant-design/icons";
import { api, store } from "../../lib";
import { useNotification } from "../../util/hooks";
import {
  VisualisationFilters,
  Map,
  Chart,
  DataChart,
  AdministrationChart,
} from "../../components";
const { Panel } = Collapse;
const { Option } = Select;

const Visualisation = () => {
  const [dataset, setDataset] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeKey, setActiveKey] = useState(null);
  const [current, setCurrent] = useState(null);
  const { selectedForm, loadingForm, questionGroups } = store.useState(
    (state) => state
  );
  const { notify } = useNotification();

  useEffect(() => {
    if (selectedForm && window.visualisation) {
      const configRes = window.visualisation.find((f) => f.id === selectedForm);
      if (configRes) {
        setCurrent(configRes);
      }
    }
  }, [selectedForm]);

  useEffect(() => {
    const rawData = questionGroups
      .filter((q) => {
        return (
          !!q.question?.filter((qn) => qn.type === "option").length || false
        );
      })
      .map((qg) => {
        return {
          id: qg.id,
          title: qg.name,
          selected:
            qg.question.filter((qi) => qi.type === "option")[0]?.id + "" ||
            null,
          data: [],
          chart: "BAR",
          question: qg.question || [],
        };
      });
    setDataset(rawData);
  }, [questionGroups]);

  const setChartType = (questionGroupId, type) => {
    const temp = dataset.map((ds) => {
      return ds.id === questionGroupId
        ? {
            ...ds,
            chart: type,
          }
        : ds;
    });
    setDataset(temp);
  };

  const fetchData = (questionGroupId, questionId) => {
    setLoading(true);
    api
      .get(`chart/data/${current.id}?question=${questionId}`)
      .then((res) => {
        let temp = [...dataset];
        temp = temp.map((ds) => {
          return ds.id === questionGroupId
            ? {
                ...ds,
                chart: res.data?.type || "BAR",
                data: res.data?.data || [],
                selected: questionId + "",
              }
            : ds;
        });
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
  };

  const handleChange = (panel) => {
    if (loading || loadingForm) {
      return;
    }
    if (panel) {
      const questionGroupRes = questionGroups.find(
        (qgS) => qgS.id === dataset[parseInt(panel)]?.id
      );
      const questionIdRes = questionGroupRes?.question.filter(
        (gq) => gq.type === "option"
      )[0]?.id;
      if (questionIdRes) {
        fetchData(questionGroupRes.id, questionIdRes);
      }
    }
    setActiveKey(panel);
  };

  useEffect(() => {
    if (selectedForm) {
      setActiveKey(null);
    }
  }, [selectedForm]);

  return (
    <div id="visualisation">
      <VisualisationFilters />
      <Row gutter={12} className="main-wrap" justify="space-between">
        <Col span={current?.charts?.length ? 12 : 24}>
          {!!current && (
            <Map
              markerData={{ features: [] }}
              style={{ height: 600 }}
              current={current}
            />
          )}
        </Col>
        {!!current?.charts?.length && (
          <Col span={12}>
            <div className="charts-wrap">
              {!!current?.chartListTitle && (
                <Divider orientation="left" orientationMargin="0">
                  {current?.chartListTitle}
                </Divider>
              )}
              {current?.charts?.map((cc, ccI) =>
                cc.type === "ADMINISTRATION" ? (
                  <AdministrationChart
                    key={`chart-${current.id}-${ccI}`}
                    formId={current.id}
                    config={cc}
                  />
                ) : (
                  <DataChart
                    key={`chart-${current.id}-${ccI}`}
                    formId={current.id}
                    config={cc}
                  />
                )
              )}
            </div>
          </Col>
        )}
      </Row>
      <Collapse
        accordion
        activeKey={activeKey}
        onChange={handleChange}
        expandIcon={({ isActive }) =>
          isActive ? (
            <CloseSquareOutlined
              style={{ color: "#E00000B3", fontSize: "16px" }}
            />
          ) : (
            <PlusSquareOutlined
              style={{ color: "#707070B3", fontSize: "16px" }}
            />
          )
        }
        expandIconPosition="right"
      >
        {dataset.map((d, dI) => (
          <Panel key={dI} header={d.title}>
            <Row
              wrap={false}
              style={{
                width: "100%",
                marginBottom: 12,
              }}
            >
              <Col flex="auto">
                <Select
                  value={d.selected}
                  disabled={loading}
                  onChange={(e) => {
                    fetchData(d.id, e);
                  }}
                  placeholder="Select one.."
                >
                  {d.question
                    ?.filter((qn) => qn.type === "option")
                    .map((qn, qnI) => (
                      <Option key={qnI} value={qn.id + ""}>
                        {qn.name}
                      </Option>
                    ))}
                </Select>
              </Col>
              <Col flex="none">
                <Space>
                  <Button
                    title="Bar Chart"
                    className={d.chart === "BAR" ? "light active" : "light"}
                    icon={<BarChartOutlined />}
                    onClick={() => {
                      setChartType(d.id, "BAR");
                    }}
                  />
                  <Button
                    title="Pie Chart"
                    className={d.chart === "PIE" ? "light active" : "light"}
                    icon={<PieChartOutlined />}
                    onClick={() => {
                      setChartType(d.id, "PIE");
                    }}
                  />
                </Space>
              </Col>
            </Row>

            {loading ? (
              <div style={{ color: "#777", margin: "12px 0" }}>Loading..</div>
            ) : d.chart === "PIE" ? (
              <Chart span={24} type={"PIE"} data={d.data} wrapper={false} />
            ) : (
              <Chart span={24} type={"BAR"} data={d.data} wrapper={false} />
            )}
          </Panel>
        ))}
      </Collapse>
    </div>
  );
};

export default React.memo(Visualisation);
