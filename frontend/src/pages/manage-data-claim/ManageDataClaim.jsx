import React, { useState, useEffect, useMemo } from "react";
import "./style.scss";
import { Row, Col, Divider, Table, ConfigProvider, Empty } from "antd";
import { DownCircleOutlined, LeftCircleOutlined } from "@ant-design/icons";
import { api, config, store, uiText } from "../../lib";
import {
  Breadcrumbs,
  DescriptionPanel,
  DataClaimFilters,
} from "../../components";
import { generateAdvanceFilterURL } from "../../util/filter";
import DataClaimDetail from "./DataClaimDetail";

const ManageDataClaim = () => {
  const [loading, setLoading] = useState(false);
  const [dataset, setDataset] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [updateRecord, setUpdateRecord] = useState(false);
  const [preload, setPreload] = useState(true);
  const [isAdmFilter, setIsAdmFilter] = useState(false);

  const {
    language,
    advancedFilters,
    administration,
    selectedForm,
    questionGroups,
  } = store.useState((s) => s);
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
      title: text.ManageDataClaimTitle,
    },
  ];

  const isAdministrationLoaded = administration.length;
  const selectedAdministration =
    administration.length > 0
      ? administration[administration.length - 1]
      : null;
  const [currentAdm, setCurrentAdm] = useState(selectedAdministration?.id);

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
    Table.EXPAND_COLUMN,
  ];

  const handleChange = (e) => {
    setCurrentPage(e.current);
  };

  useEffect(() => {
    if (selectedAdministration?.id && preload && !currentAdm) {
      setPreload(false);
      setCurrentAdm(selectedAdministration.id);
    }
    if (!preload && !isAdmFilter && selectedAdministration?.id !== currentAdm) {
      setIsAdmFilter(true);
    }
    if (currentAdm === selectedAdministration?.id && isAdmFilter) {
      setIsAdmFilter(false);
    }
  }, [currentAdm, preload, selectedAdministration, isAdmFilter]);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedAdministration]);

  useEffect(() => {
    if (selectedForm && isAdministrationLoaded && !updateRecord) {
      setLoading(true);
      let url = `/form-data/${selectedForm}/?submission_type=${config.submissionType.certification}&page=${currentPage}`;
      if (selectedAdministration?.id && isAdmFilter) {
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
    isAdmFilter,
  ]);

  return (
    <div id="manage-data-claim">
      <div className="description-container">
        <Row justify="space-between">
          <Col>
            <Breadcrumbs pagePath={pagePath} />
            <DescriptionPanel
              description={text.ManageDataClaimText}
              title={text.ManageDataClaimTitle}
            />
          </Col>
        </Row>
      </div>

      <div className="table-section">
        <div className="table-wrapper">
          <DataClaimFilters />
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
                expandable={{
                  expandedRowRender: (record) => (
                    <DataClaimDetail
                      questionGroups={questionGroups}
                      record={record}
                    />
                  ),
                  expandIcon: ({ expanded, onExpand, record }) =>
                    expanded ? (
                      <DownCircleOutlined
                        onClick={(e) => onExpand(record, e)}
                        style={{ color: "#1651B6", fontSize: "19px" }}
                      />
                    ) : (
                      <LeftCircleOutlined
                        onClick={(e) => onExpand(record, e)}
                        style={{ color: "#1651B6", fontSize: "19px" }}
                      />
                    ),
                }}
                rowClassName="expandable-row row-normal sticky"
                expandRowByClick
              />
            </ConfigProvider>
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(ManageDataClaim);
