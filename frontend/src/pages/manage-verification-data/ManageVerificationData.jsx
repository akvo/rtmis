import React, { useState, useEffect, useMemo } from "react";
import "./style.scss";
import { Row, Col, Divider, Table, ConfigProvider, Empty } from "antd";
import { useNavigate } from "react-router-dom";
import { api, config, store, uiText } from "../../lib";
import {
  Breadcrumbs,
  DescriptionPanel,
  DataClaimFilters,
} from "../../components";
import { generateAdvanceFilterURL } from "../../util/filter";

const ManageVerificationData = () => {
  const [loading, setLoading] = useState(false);
  const [dataset, setDataset] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [updateRecord, setUpdateRecord] = useState(false);
  const navigate = useNavigate();

  const { language, advancedFilters, administration, selectedForm } =
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
      title: text.ManageVerificationDataTitle,
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
    setCurrentPage(1);
  }, [selectedAdministration]);

  useEffect(() => {
    if (selectedForm && isAdministrationLoaded && !updateRecord) {
      setLoading(true);
      let url = `/form-data/${selectedForm}/?submission_type=${config.submissionType.verification}&page=${currentPage}`;
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
    selectedAdministration,
    currentPage,
    isAdministrationLoaded,
    updateRecord,
    advancedFilters,
  ]);

  return (
    <div id="manage-verification-data">
      <div className="description-container">
        <Row justify="space-between">
          <Col>
            <Breadcrumbs pagePath={pagePath} />
            <DescriptionPanel
              description={text.ManageVerificationDataText}
              title={text.ManageVerificationDataTitle}
            />
          </Col>
        </Row>
      </div>

      <div className="table-section">
        <div className="table-wrapper">
          <DataClaimFilters
            submissionType={config.submissionType.verification}
          />
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
                rowKey="id"
                onRow={(record) => ({
                  onClick: () =>
                    navigate(
                      `/control-center/verification-data/${selectedForm}/verification/${record.id}`
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

export default React.memo(ManageVerificationData);
