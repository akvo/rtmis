import React, { useState, useEffect } from "react";
import "./style.scss";
import { Row, Col, Card, Divider, Collapse, Space, Button, Select } from "antd";
import {
  PlusSquareOutlined,
  CloseSquareOutlined,
  BarChartOutlined,
  PieChartOutlined,
} from "@ant-design/icons";
import { api, store } from "../../lib";
import { useNotification } from "../../util/hooks";
import { VisualisationFilters, Map, Chart } from "../../components";
const { Panel } = Collapse;
const { Option } = Select;

const Visualisation = () => {
  const [dataset, setDataset] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeKey, setActiveKey] = useState(null);
  const { selectedForm, forms, loadingForm, questionGroups } = store.useState(
    (state) => state
  );
  const { notify } = useNotification();

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
          question:
            qg.question?.map((qn) => ({
              ...qn,
            })) || [],
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
      .get(`chart/data/${selectedForm}?question=${questionId}`)
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
      <Divider />
      <Card style={{ padding: 0, minHeight: "40vh", textAlign: "left" }}>
        <Row justify="space-between">
          <Col span={11}>
            <h2>{forms?.find((f) => f.id === selectedForm)?.name}</h2>
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
                    style={{
                      width: "100%",
                      flexWrap: "nowrap",
                      marginBottom: 12,
                    }}
                  >
                    <Col flex={1}>
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
                    <Col>
                      <Space>
                        <Button
                          title="Bar Chart"
                          className={
                            d.chart === "BAR" ? "light active" : "light"
                          }
                          icon={<BarChartOutlined />}
                          onClick={() => {
                            setChartType(d.id, "BAR");
                          }}
                        />
                        <Button
                          title="Pie Chart"
                          className={
                            d.chart === "PIE" ? "light active" : "light"
                          }
                          icon={<PieChartOutlined />}
                          onClick={() => {
                            setChartType(d.id, "PIE");
                          }}
                        />
                      </Space>
                    </Col>
                  </Row>

                  {loading ? (
                    <div style={{ color: "#777", margin: "12px 0" }}>
                      Loading..
                    </div>
                  ) : d.chart === "PIE" ? (
                    <Chart
                      span={24}
                      type={"PIE"}
                      data={d.data}
                      wrapper={false}
                    />
                  ) : (
                    <Chart
                      span={24}
                      type={"BAR"}
                      data={d.data}
                      wrapper={false}
                    />
                  )}
                </Panel>
              ))}
            </Collapse>
          </Col>
          <Col span={12}>
            <Map markerData={{ features: [] }} style={{ height: 585 }} />
          </Col>
        </Row>
      </Card>
    </div>
  );
};

export default React.memo(Visualisation);
