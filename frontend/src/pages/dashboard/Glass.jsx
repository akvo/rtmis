import React, { useState, useEffect, useMemo } from "react";
import "./style.scss";
import { useParams } from "react-router-dom";
import { Row, Col, Tabs } from "antd";
import { uiText, store } from "../../lib";
import example from "./example";
import { capitalize, get } from "lodash";
import { CardVisual, TableVisual, ChartVisual } from "./components";
import { Maps } from "../../components";
import moment from "moment";

const { TabPane } = Tabs;

const Dashboard = () => {
  const { formId } = useParams();
  const selectedForm = window?.forms?.find((x) => String(x.id) === formId);
  const current = window?.dashboard?.find((x) => String(x.form_id) === formId);

  const [dataset, setDataset] = useState({});
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(false);
  const [activeItem, setActiveItem] = useState(null);

  const { active: activeLang } = store.useState((s) => s.language);

  const text = useMemo(() => {
    return uiText[activeLang];
  }, [activeLang]);

  useEffect(() => {
    if (selectedForm?.id) {
      store.update((s) => {
        s.questionGroups = selectedForm.content.question_group;
      });
      setActiveTab("overview");
      setActiveItem(current?.tabs?.["overview"]);
    }
  }, [selectedForm, current]);

  useEffect(() => {
    if (formId) {
      setDataset({});
      setLoading(true);
      /*
      const url = `glass/${formId}`;
      api
        .get(url)
        .then((res) => {
          setDataset(res.data);
        })
        .catch(() => {
          notify({
            type: "error",
            message: text.errorDataLoad,
          });
        })
        .finally(() => {
          setLoading(false);
        });
        */
      setDataset(example);
      setLoading(false);
    }
  }, [formId, text]);

  const changeTab = (tabKey) => {
    setActiveTab(tabKey);
    setActiveItem(current.tabs[tabKey]);
  };

  const renderColumn = (cfg, index) => {
    switch (cfg.type) {
      case "chart":
        return (
          <ChartVisual
            key={index}
            chartConfig={{
              ...cfg,
              data: dataset[cfg.from] || [],
              index: index,
            }}
            loading={loading}
          />
        );
      case "maps":
        return (
          <Maps
            key={index}
            mapConfig={{
              ...cfg,
              data: dataset?.[cfg.from] || [],
              index: index,
            }}
            loading={loading}
          />
        );
      case "table":
        return (
          <TableVisual
            key={index}
            tableConfig={{
              ...cfg,
              data: dataset?.[cfg.from] || [],
              index: index,
            }}
            loading={loading}
          />
        );
      default:
        return (
          <CardVisual
            key={index}
            cardConfig={{
              ...cfg,
              data: dataset?.[cfg.from] || [],
              index: index,
              lastUpdate: moment().format("L"),
            }}
            getTotal={(d, path) => get(d, path)}
            loading={loading}
          />
        );
    }
  };

  return (
    <div id="dashboard">
      <div className="page-title-wrapper">
        <h1>{selectedForm?.name}</h1>
      </div>
      <Row className="main-wrapper" align="center">
        <Col span={24} align="center">
          {current?.tabs && (
            <>
              <Tabs activeKey={activeTab} onChange={changeTab}>
                {Object.keys(current.tabs).map((key) => {
                  let tabName = key;
                  if (!["jmp", "glass"].includes(key.toLocaleLowerCase())) {
                    tabName = key
                      .split("_")
                      .map((x) => capitalize(x))
                      .join(" ");
                  } else {
                    tabName = key.toUpperCase();
                  }
                  return <TabPane tab={tabName} key={key}></TabPane>;
                })}
              </Tabs>
              {activeItem?.rows ? (
                activeItem.rows.map((row, index) => {
                  return (
                    <Row
                      key={`row-${index}`}
                      className="row-wrapper"
                      justify="space-between"
                      gutter={[10, 10]}
                    >
                      {row.map((r, ri) => renderColumn(r, ri))}
                    </Row>
                  );
                })
              ) : (
                <h4>No data</h4>
              )}
            </>
          )}
        </Col>
      </Row>
    </div>
  );
};

export default React.memo(Dashboard);
