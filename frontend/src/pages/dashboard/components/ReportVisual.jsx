import React, { useState, useEffect } from "react";
import { Col, Table } from "antd";
import {
  LeftCircleOutlined,
  DownCircleOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";
import { generateAdvanceFilterURL } from "../../../util/filter";
import DataDetail from "../../manage-data/DataDetail";
import { api, store } from "../../../lib";

const ReportVisual = ({ selectedForm }) => {
  const [dataset, setDataset] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [updateRecord, setUpdateRecord] = useState(false);
  const { advancedFilters } = store.useState((s) => s);
  const { administration, questionGroups } = store.useState((state) => state);

  const selectedAdministration =
    administration.length > 0
      ? administration[administration.length - 1]
      : null;

  useEffect(() => {
    if (selectedForm?.id && !updateRecord) {
      setLoading(true);
      let url = `/form-data/${selectedForm.id}/?page=${currentPage}`;
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
    updateRecord,
    advancedFilters,
  ]);

  const columns = [
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      filtered: true,
      onFilter: (value, filters) =>
        filters.name.toLowerCase().includes(value.toLowerCase()),
      render: (value) => (
        <span className="with-icon">
          <ExclamationCircleOutlined />
          {value}
        </span>
      ),
    },
    {
      title: "Last Updated",
      dataIndex: "updated",
      render: (cell, row) => cell || row.created,
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

  return (
    <Col
      align="center"
      justify="space-between"
      span={24}
      className="table-card"
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
            <DataDetail
              questionGroups={questionGroups}
              record={record}
              isPublic={true}
            />
          ),
          expandIcon: ({ expanded, onExpand, record }) =>
            expanded ? (
              <DownCircleOutlined
                onClick={(e) => onExpand(record, e)}
                style={{ color: "#e94b4c", fontSize: "16px" }}
              />
            ) : (
              <LeftCircleOutlined
                onClick={(e) => onExpand(record, e)}
                style={{ color: "#1651B6", fontSize: "19px" }}
              />
            ),
        }}
      />
    </Col>
  );
};

export default ReportVisual;
