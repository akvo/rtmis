import React, { useState, useEffect } from "react";
import { Row, Col, Collapse, Space, Button, Select } from "antd";
import {
  LeftCircleOutlined,
  DownCircleOutlined,
  BarChartOutlined,
  PieChartOutlined,
} from "@ant-design/icons";
import { Chart } from "../../../components";
import { api, store } from "../../../lib";
import { useNotification } from "../../../util/hooks";
import { generateAdvanceFilterURL } from "../../../util/filter";

const { Panel } = Collapse;
const { Option } = Select;

const QuestionChart = () => {
  const [dataset, setDataset] = useState([]);
  const [activeKey, setActiveKey] = useState(null);
  const [filteredQuestionGroups, setFilteredQuestionGroup] = useState([]);
  const [loading, setLoading] = useState(false);
  const { notify } = useNotification();
  const {
    selectedForm: formId,
    loadingForm,
    questionGroups,
    advancedFilters,
  } = store.useState((state) => state);
  const [selectedChartOptions, setSelectedChartOptions] = useState({
    qgid: null,
    qid: null,
  });

  useEffect(() => {
    if (questionGroups) {
      setLoading(true);
      const filtered = questionGroups
        ?.filter((qg) => {
          return qg.question.filter((q) => q?.attributes?.includes("chart"))
            ?.length;
        })
        .map((qg) => {
          return {
            ...qg,
            question: qg.question.filter((q) =>
              q?.attributes?.includes("chart")
            ),
          };
        });
      setFilteredQuestionGroup(filtered);
      setLoading(false);
    }
  }, [questionGroups]);

  useEffect(() => {
    setDataset(
      filteredQuestionGroups.map((qg) => {
        return {
          id: qg.id,
          title: qg.name,
          selected: qg.question[0]?.id,
          data: [],
          chart: "PIE",
          question: qg.question || [],
        };
      })
    );
  }, [filteredQuestionGroups]);

  const fetchData = (questionGroupId, questionId) => {
    if (formId) {
      if (
        selectedChartOptions.qgid !== questionGroupId &&
        selectedChartOptions.qid !== questionId
      ) {
        setSelectedChartOptions({ qgid: questionGroupId, qid: questionId });
      }
      setLoading(true);
      let url = `chart/data/${formId}?question=${questionId}`;
      if (advancedFilters && advancedFilters.length) {
        url = generateAdvanceFilterURL(advancedFilters, url);
      }
      api
        .get(url)
        .then((res) => {
          let temp = [...dataset];
          temp = temp.map((ds) => {
            return ds.id === questionGroupId
              ? {
                  ...ds,
                  chart: res.data?.type || "PIE",
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
    }
  };

  useEffect(() => {
    const { qgid, qid } = selectedChartOptions;
    if (advancedFilters && advancedFilters.length && qgid && qid) {
      fetchData(qgid, qid);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedChartOptions, advancedFilters]);

  const handleChange = (panel) => {
    if (loading || loadingForm) {
      return;
    }
    if (panel) {
      const questionGroupRes = filteredQuestionGroups.find(
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

  useEffect(() => {
    if (formId) {
      setActiveKey(null);
    }
  }, [formId]);

  return (
    <Collapse
      accordion
      destroyInactivePanel={true}
      activeKey={activeKey}
      onChange={handleChange}
      expandIcon={({ isActive }) =>
        isActive ? (
          <DownCircleOutlined style={{ color: "#1651B6", fontSize: "19px" }} />
        ) : (
          <LeftCircleOutlined style={{ color: "#1651B6", fontSize: "19px" }} />
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
                  title="Pie Chart"
                  className={d.chart === "PIE" ? "light active" : "light"}
                  icon={<PieChartOutlined />}
                  onClick={() => {
                    setChartType(d.id, "PIE");
                  }}
                />
                <Button
                  title="Bar Chart"
                  className={d.chart === "BAR" ? "light active" : "light"}
                  icon={<BarChartOutlined />}
                  onClick={() => {
                    setChartType(d.id, "BAR");
                  }}
                />
              </Space>
            </Col>
          </Row>
          <div style={{ minHeight: "400px" }}>
            {loading ? (
              <div style={{ color: "#777", margin: "12px 0" }}>Loading..</div>
            ) : (
              <Chart
                span={24}
                type={d.chart}
                data={d.data}
                wrapper={false}
                styles={{ minHeight: "400px", height: "400px", width: "100%" }}
              />
            )}
          </div>
        </Panel>
      ))}
    </Collapse>
  );
};

export default React.memo(QuestionChart);
