import React, { useState, useEffect, useMemo, useCallback } from "react";
import "./style.scss";
import { Row, Col, Divider, Table, ConfigProvider, Empty } from "antd";
import { useNavigate } from "react-router-dom";
import { api, config, store, uiText } from "../../lib";
import {
  Breadcrumbs,
  DescriptionPanel,
  CertificationDataFilters,
} from "../../components";
import { generateAdvanceFilterURL } from "../../util/filter";

const ManageCertificationData = () => {
  const [loading, setLoading] = useState(false);
  const [dataset, setDataset] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [updateRecord, setUpdateRecord] = useState(true);
  const [activeFilter, setActiveFilter] = useState(null);
  const navigate = useNavigate();

  const { language, advancedFilters, administration, selectedForm, forms } =
    store.useState((s) => s);
  const { active: activeLang } = language;
  const text = useMemo(() => {
    return uiText[activeLang];
  }, [activeLang]);

  const pagePath = [
    {
      title: text.controlCenter,
      link: "/control-center",
    },
    {
      title: text.ManageCertificationDataTitle,
    },
  ];

  const isAdministrationLoaded = administration.length;
  const selectedAdministration =
    administration.length > 0
      ? administration[administration.length - 1]
      : null;

  const columns = [
    {
      title: "Last Updated",
      dataIndex: "updated",
      render: (cell, row) => cell || row.created,
    },
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      filtered: true,
      onFilter: (value, filters) =>
        filters.name.toLowerCase().includes(value.toLowerCase()),
    },
    {
      title: "User",
      dataIndex: "created_by",
    },
    {
      title: "Region",
      dataIndex: "administration",
    },
  ];

  const certificationForms = useMemo(() => {
    const form_items = window.forms || forms;
    return form_items
      .filter((f) =>
        f.content.submission_types.includes(config.submissionType.certification)
      )
      .map((f) => f?.id);
  }, [forms]);

  const handleChange = (e) => {
    setUpdateRecord(true);
    setCurrentPage(e.current);
  };

  useEffect(() => {
    if (
      !updateRecord &&
      !activeFilter &&
      selectedAdministration?.id &&
      administration.length > 1
    ) {
      setActiveFilter(selectedAdministration?.id);
      setUpdateRecord(true);
    }
    if (
      activeFilter &&
      isAdministrationLoaded &&
      activeFilter !== selectedAdministration?.id
    ) {
      setActiveFilter(selectedAdministration.id);
      if (!updateRecord) {
        setCurrentPage(1);
        setUpdateRecord(true);
      }
    }
  }, [
    activeFilter,
    selectedAdministration,
    isAdministrationLoaded,
    updateRecord,
    administration,
  ]);

  const fetchData = useCallback(() => {
    if (
      selectedForm &&
      certificationForms.includes(selectedForm) &&
      isAdministrationLoaded &&
      updateRecord
    ) {
      setUpdateRecord(false);
      setLoading(true);
      let url = `/certifications/${selectedForm}/?page=${currentPage}`;
      if (selectedAdministration?.id) {
        url += `&administration=${selectedAdministration.id}`;
      }
      if (advancedFilters && advancedFilters.length) {
        url = generateAdvanceFilterURL(advancedFilters, url);
      }
      api
        .get(url)
        .then((res) => {
          setDataset(res.data.data);
          setTotalCount(res.data.total);
          if (res.data.total < currentPage) {
            setCurrentPage(1);
          }
          setLoading(false);
        })
        .catch(() => {
          setDataset([]);
          setTotalCount(0);
          setLoading(false);
        });
    }
  }, [
    certificationForms,
    selectedForm,
    currentPage,
    isAdministrationLoaded,
    updateRecord,
    advancedFilters,
    selectedAdministration,
  ]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    const unsubscribe = store.subscribe(
      (s) => s.selectedForm,
      () => {
        setUpdateRecord(true);
      }
    );
    return () => {
      unsubscribe();
    };
  }, []);

  return (
    <div id="manage-certification-data">
      <div className="description-container">
        <Row justify="space-between">
          <Col>
            <Breadcrumbs pagePath={pagePath} />
            <DescriptionPanel
              description={text.ManageCertificationDataText}
              title={text.ManageCertificationDataTitle}
            />
          </Col>
        </Row>
      </div>

      <div className="table-section">
        <div className="table-wrapper">
          <CertificationDataFilters />
          <Divider />
          <div
            style={{ padding: 0, minHeight: "40vh" }}
            bodystyle={{ padding: 0 }}
          >
            <ConfigProvider
              renderEmpty={() => (
                <Empty
                  description={
                    selectedForm ? text.noFormText : text.noFormSelectedText
                  }
                />
              )}
            >
              <Table
                columns={columns}
                dataSource={dataset}
                loading={loading}
                onChange={handleChange}
                pagination={{
                  current: currentPage,
                  total: totalCount,
                  pageSize: 10,
                  showSizeChanger: false,
                  showTotal: (total, range) =>
                    `Results: ${range[0]} - ${range[1]} of ${total} data`,
                }}
                rowClassName="row-normal sticky"
                rowKey="id"
                onRow={(record) => ({
                  onClick: () =>
                    navigate(
                      `/control-center/certification-data/${selectedForm}/certification/${record.id}`
                    ),
                })}
              />
            </ConfigProvider>
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(ManageCertificationData);
