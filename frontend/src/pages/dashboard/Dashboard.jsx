import React, { useState, useEffect, useMemo } from "react";
import "./style.scss";
import { useParams } from "react-router-dom";
import { Row, Col, Tabs } from "antd";
import { VisualisationFilters } from "../../components";
import { useNotification } from "../../util/hooks";
import { api, uiText, store } from "../../lib";
import { capitalize } from "lodash";
import { CardVisual, Maps } from "../../components";

const { TabPane } = Tabs;

const Dashboard = () => {
  const { formId } = useParams();
  const selectedForm = window?.forms?.find((x) => String(x.id) === formId);
  const current = window?.dashboard?.find((x) => String(x.form_id) === formId);
  const { notify } = useNotification();

  const { language } = store.useState((s) => s);
  const { active: activeLang } = language;
  const [dataset, setDataset] = useState([]);
  const [activeTab, setActiveTab] = useState("overview");

  const text = useMemo(() => {
    return uiText[activeLang];
  }, [activeLang]);

  useEffect(() => {
    if (formId) {
      const url = `jmp/${formId}?administration=1`;
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
        });
    }
  }, [formId, notify, text]);

  const renderColumn = (config, index) => {
    switch (config.type) {
      case "map":
        return <Maps mapConfig={{ ...config, data: dataset, index: index }} />;
      case "chart":
        return <p>Chart</p>;
      case "table":
        return <p> Table</p>;
      default:
        return (
          <CardVisual config={{ ...config, data: dataset, index: index }} />
        );
    }
  };

  return (
    <div id="dashboard">
      <div className="page-title-wrapper">
        <h1>{`${selectedForm.name} Data`}</h1>
      </div>
      <VisualisationFilters showFormOptions={false} />
      <Row className="main-wrapper" align="top">
        <Col span={24} align="center">
          {current?.tabs ? (
            <Tabs
              activeKey={activeTab}
              onChange={(tabKey) => setActiveTab(tabKey)}
            >
              {Object.keys(current.tabs).map((key) => {
                const item = current.tabs[key];
                const tabName = key
                  .split("_")
                  .map((x) => capitalize(x))
                  .join(" ");
                return (
                  <TabPane tab={tabName} key={key}>
                    {item?.rows ? (
                      item.rows.map((row, index) => {
                        return (
                          <Row
                            key={`row-${index}`}
                            className="row-wrapper"
                            gutter={[10, 10]}
                          >
                            {row.map((r, ri) => renderColumn(r, ri))}
                          </Row>
                        );
                      })
                    ) : (
                      <h4>No data</h4>
                    )}
                  </TabPane>
                );
              })}
            </Tabs>
          ) : (
            <h4>No data</h4>
          )}
        </Col>
      </Row>
    </div>
  );
};

export default React.memo(Dashboard);
