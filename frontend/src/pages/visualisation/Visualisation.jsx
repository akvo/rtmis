import React, { useState, useEffect } from "react";
import "./style.scss";
import { Row, Col, Card, Divider, Collapse, Space, Button, List } from "antd";
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

const Visualisation = () => {
  const [dataset, setDataset] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeKey, setActiveKey] = useState(null);
  const { selectedForm, forms, questionGroups } = store.useState(
    (state) => state
  );
  const { notify } = useNotification();

  useEffect(() => {
    setDataset(() => {
      return questionGroups
        .filter((q) => {
          return (
            !!q.question?.filter((qn) => qn.type === "option").length || false
          );
        })
        .map((qg) => {
          return {
            id: qg.id,
            title: qg.name,
            question:
              qg.question?.map((qn) => ({
                ...qn,
                chart: "BAR",
                data: [],
              })) || [],
          };
        });
    });
  }, [questionGroups]);

  const setChartType = (main, sub, type) => {
    const temp = dataset.map((ds) => {
      return ds.id === main
        ? {
            ...ds,
            question:
              ds.question?.map((dQ) =>
                dQ.id === sub ? { ...dQ, chart: type } : dQ
              ) || [],
          }
        : ds;
    });
    setDataset(temp);
  };

  const handleChange = (panel) => {
    if (loading) {
      return;
    }
    if (panel) {
      setActiveKey(panel);
      const questionGroupRes = questionGroups.find(
        (qgS) => qgS.id === dataset[panel]?.id
      );
      const questionIds =
        questionGroupRes.question
          ?.filter((qn) => qn.type === "option")
          .map((qn) => qn.id) || [];
      setLoading(true);
      const apiCall = questionIds?.map((questionId) =>
        api.get(`chart/data/${selectedForm}?question=${questionId}`)
      );
      Promise.all(apiCall)
        .then((res) => {
          let temp = [...dataset];
          res.map((rItem, rIdx) => {
            temp = temp.map((ds) => {
              return ds.id === questionGroupRes.id
                ? {
                    ...ds,
                    question:
                      ds.question?.map((dQ) =>
                        dQ.id === questionIds[rIdx]
                          ? {
                              ...dQ,
                              chart: rItem.data?.type || "BAR",
                              data: rItem.data?.data || [],
                            }
                          : dQ
                      ) || [],
                  }
                : ds;
            });
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
    }
  };

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
                  <List
                    dataSource={d.question?.filter(
                      (qn) => qn.type === "option"
                    )}
                    renderItem={(item) => (
                      <List.Item>
                        <Row
                          style={{
                            width: "100%",
                            flexWrap: "nowrap",
                            marginBottom: 12,
                          }}
                        >
                          <Col flex={1}>
                            <h3>{item.name}</h3>
                          </Col>
                          <Col>
                            <Space>
                              <Button
                                title="Bar Chart"
                                className={
                                  item.chart === "BAR"
                                    ? "light active"
                                    : "light"
                                }
                                icon={<BarChartOutlined />}
                                onClick={() => {
                                  setChartType(d.id, item.id, "BAR");
                                }}
                              />
                              <Button
                                title="Pie Chart"
                                className={
                                  item.chart === "PIE"
                                    ? "light active"
                                    : "light"
                                }
                                icon={<PieChartOutlined />}
                                onClick={() => {
                                  setChartType(d.id, item.id, "PIE");
                                }}
                              />
                            </Space>
                          </Col>
                        </Row>
                        <div>
                          {loading ? (
                            <div className="text-muted">Loading..</div>
                          ) : (
                            <Chart
                              span={24}
                              type={item.chart || "BAR"}
                              data={item.data}
                              wrapper={false}
                            />
                          )}
                        </div>
                      </List.Item>
                    )}
                    itemLayout="vertical"
                  />
                </Panel>
              ))}
            </Collapse>
          </Col>
          <Col span={12}>
            <Map markerData={{ features: [] }} style={{ height: 400 }} />
          </Col>
        </Row>
      </Card>
    </div>
  );
};

export default React.memo(Visualisation);
