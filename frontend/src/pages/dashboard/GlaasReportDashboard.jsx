import React, { useState, useEffect, useMemo } from "react";
import "./style.scss";
import { useParams } from "react-router-dom";
import { Row, Col, Tabs, Affix, Select, Space } from "antd";
import { uiText, store, api } from "../../lib";
import { capitalize } from "lodash";
import { TableVisual } from "./components";
import {
  RemoveFiltersButton,
  // AdvancedFiltersButton,
  AdvancedFilters,
} from "../../components";
import { generateAdvanceFilterURL } from "../../util/filter";
import { useNotification } from "../../util/hooks";
import { useCallback } from "react";

const { TabPane } = Tabs;

const GlassReportDashboard = () => {
  const { formId } = useParams();
  const selectedForm = window?.forms?.find((x) => String(x.id) === formId);
  const current = window?.reports?.find((x) => String(x.form_id) === formId);

  const [dataset, setDataset] = useState({});
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(false);
  const [activeItem, setActiveItem] = useState(null);
  const [wait, setWait] = useState(true);
  const [countiesAdm, setCountiesAdm] = useState([]);
  const { notify } = useNotification();

  const { active: activeLang } = store.useState((s) => s.language);
  const advancedFilters = store.useState((s) => s.advancedFilters);
  const [selectedCounty, setSelectedCounty] = useState(null);
  const [allData, setAllData] = useState([]);

  const text = useMemo(() => {
    return uiText[activeLang];
  }, [activeLang]);

  const fetchUserAdmin = useCallback(async () => {
    try {
      const { data: countyAdm } = await api.get(`administration/${1}`);
      setCountiesAdm(countyAdm.children);
      store.update((s) => {
        s.administration = [countyAdm];
      });
      setWait(false);
    } catch (error) {
      console.error(error);
    }
  }, []);

  useEffect(() => {
    fetchUserAdmin();
  }, [fetchUserAdmin]);

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
    if (formId && !wait) {
      setDataset({});
      setLoading(true);
      const { counties_questions, national_questions } = current.params;
      // generate URL
      const countiesURL = counties_questions.join("&counties_questions=");
      const nationalURL = national_questions.join("&national_questions=");
      let url = `glaas/${formId}?counties_questions=${countiesURL}&national_questions=${nationalURL}`;
      if (advancedFilters && advancedFilters.length) {
        url = generateAdvanceFilterURL(advancedFilters, url);
      }
      api
        .get(url)
        .then((res) => {
          setDataset(res.data);
          setAllData(res.data);
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
      setLoading(false);
    }
  }, [formId, text, wait, current, notify, advancedFilters]);

  useEffect(() => {
    if (!selectedCounty && !Object.keys(dataset).length) {
      setDataset(allData);
    }
    if (selectedCounty && !Object.keys(dataset).length) {
      api.get(`administrations/${selectedCounty}`).then((res) => {
        const countyName = res.name?.toLowerCase();
        const filterCounties = allData.counties.filter(
          (c) => c.loc.toLowerCase() === countyName
        );
        setDataset({ ...allData, counties: filterCounties });
      });
    }
  }, [allData, selectedCounty, dataset]);

  const changeTab = (tabKey) => {
    setActiveTab(tabKey);
    setActiveItem(current.tabs[tabKey]);
  };

  const renderColumn = (cfg, index) => {
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
  };

  return (
    <div id="dashboard">
      <Affix className="sticky-wrapper">
        <div>
          <div className="page-title-wrapper">
            <h1>{`${selectedForm.name} Data`}</h1>
          </div>
          <div className="county-filter-wrapper">
            <Row
              align="bottom"
              justify="space-between"
              gutter={[0, 20]}
              wrap={true}
            >
              <Col>
                <Space>
                  {/* County filter */}
                  <Select
                    placeholder="Select County"
                    style={{ width: 200 }}
                    onChange={(e) => {
                      setDataset({});
                      setSelectedCounty(e);
                    }}
                    onClear={() => {
                      setDataset({});
                      setSelectedCounty(null);
                    }}
                    getPopupContainer={(trigger) => trigger.parentNode}
                    dropdownMatchSelectWidth={false}
                    value={selectedCounty || []}
                    disabled={!countiesAdm.length}
                    allowClear
                    showSearch
                    filterOption={true}
                    optionFilterProp="children"
                  >
                    {countiesAdm.map((optionValue, optionIdx) => (
                      <Select.Option key={optionIdx} value={optionValue.id}>
                        {optionValue.name}
                      </Select.Option>
                    ))}
                  </Select>
                  <RemoveFiltersButton />
                  {/* <AdvancedFiltersButton /> */}
                </Space>
              </Col>
            </Row>
            <AdvancedFilters />
          </div>
          <div className="tab-wrapper">
            {current?.tabs && (
              <Tabs
                activeKey={activeTab}
                onChange={changeTab}
                type="card"
                tabBarGutter={10}
              >
                {Object.keys(current.tabs).map((key) => {
                  let tabName = key;
                  if (
                    !["jmp", "glaas", "rush"].includes(key.toLocaleLowerCase())
                  ) {
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
            )}
          </div>
        </div>
      </Affix>
      <Row className="main-wrapper" align="center">
        <Col span={24} align="center">
          {current?.tabs && activeItem?.rows ? (
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
        </Col>
      </Row>
    </div>
  );
};

export default React.memo(GlassReportDashboard);
