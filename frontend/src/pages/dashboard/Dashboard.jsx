import React, { useState, useEffect, useMemo } from "react";
import "./style.scss";
import { useParams } from "react-router-dom";
import { Row, Col, Tabs, Spin } from "antd";
import { LoadingOutlined } from "@ant-design/icons";
import { VisualisationFilters } from "../../components";
import { useNotification } from "../../util/hooks";
import { api, uiText, store, config } from "../../lib";
import { capitalize, takeRight } from "lodash";
import { Maps } from "../../components";
import { CardVisual, TableVisual, ChartVisual } from "./components";
import { generateAdvanceFilterURL } from "../../util/filter";

const { TabPane } = Tabs;

const Dashboard = () => {
  const { formId } = useParams();
  const selectedForm = window?.forms?.find((x) => String(x.id) === formId);
  const current = window?.dashboard?.find((x) => String(x.form_id) === formId);
  const { notify } = useNotification();

  const { language, administration, advancedFilters } = store.useState(
    (s) => s
  );
  const { active: activeLang } = language;
  const [dataset, setDataset] = useState([]);
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(false);

  const text = useMemo(() => {
    return uiText[activeLang];
  }, [activeLang]);

  useEffect(() => {
    store.update((s) => {
      s.administration = [config.fn.administration(1)];
    });
  }, []);

  useEffect(() => {
    if (selectedForm?.id) {
      store.update((s) => {
        s.questionGroups = selectedForm.content.question_group;
      });
    }
  }, [selectedForm]);

  useEffect(() => {
    const currentAdministration = takeRight(administration)?.[0]?.id;
    if (formId) {
      setLoading(true);
      let url = `jmp/${formId}?administration=${currentAdministration}`;
      if (advancedFilters && advancedFilters.length) {
        url = generateAdvanceFilterURL(advancedFilters, url);
      }
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
    }
  }, [formId, administration, notify, text, advancedFilters]);

  const renderColumn = (cfg, index) => {
    switch (cfg.type) {
      case "maps":
        return (
          <Maps
            key={index}
            mapConfig={{ ...cfg, data: dataset, index: index }}
          />
        );
      case "chart":
        return (
          <ChartVisual
            key={index}
            chartConfig={{ ...cfg, data: dataset, index: index }}
          />
        );
      case "table":
        return (
          <TableVisual
            key={index}
            tableConfig={{ ...cfg, data: dataset, index: index }}
          />
        );
      default:
        return (
          <CardVisual
            key={index}
            cardConfig={{ ...cfg, data: dataset, index: index }}
          />
        );
    }
  };

  return (
    <div id="dashboard">
      <div className="page-title-wrapper">
        <h1>{`${selectedForm.name} Data`}</h1>
      </div>
      <VisualisationFilters showFormOptions={false} />
      <Row className="main-wrapper" align="center">
        <Col span={24} align="center">
          {loading && (
            <Spin
              className="loading"
              indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />}
            />
          )}
          {!loading && current?.tabs && (
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
          )}
          {!loading && !current?.tabs && <h4>No data</h4>}
        </Col>
      </Row>
    </div>
  );
};

export default React.memo(Dashboard);
