import React, { useState, useEffect, useMemo } from "react";
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
  const [updateRecord, setUpdateRecord] = useState(false);
  const [isAdmFilter, setIsAdmFilter] = useState(false);
  const navigate = useNavigate();

  const { language, advancedFilters, administration, selectedForm, user } =
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

  const handleChange = (e) => {
    setCurrentPage(e.current);
  };

  useEffect(() => {
    if (
      selectedAdministration?.id &&
      selectedAdministration?.id !== user?.administration?.id &&
      !isAdmFilter
    ) {
      setIsAdmFilter(true);
    }
    if (
      isAdmFilter &&
      selectedAdministration?.id === user?.administration?.id
    ) {
      setIsAdmFilter(false);
    }
  }, [
    isAdmFilter,
    administration,
    selectedAdministration?.id,
    user?.administration?.id,
  ]);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedAdministration]);

  useEffect(() => {
    if (selectedForm && isAdministrationLoaded && !updateRecord) {
      setLoading(true);
      let url = `/form-data/${selectedForm}/?submission_type=${config.submissionType.certification}&page=${currentPage}`;
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
          setUpdateRecord(null);
          setLoading(false);
        })
        .catch(() => {
          setDataset([]);
          setTotalCount(0);
          setLoading(false);
        });
    }
  }, [
    selectedForm,
    currentPage,
    isAdministrationLoaded,
    updateRecord,
    advancedFilters,
  ]);

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
          <CertificationDataFilters hideAdministrationDropdown={true} />
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