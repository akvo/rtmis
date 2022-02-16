import React, { useState, useEffect } from "react";
import "./style.scss";
import {
  Row,
  Col,
  Card,
  Breadcrumb,
  Divider,
  Typography,
  Table,
  message,
  ConfigProvider,
  Empty,
} from "antd";
import { Link } from "react-router-dom";
import {
  PlusSquareOutlined,
  CloseSquareOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";
import { api, store } from "../../lib";
import DataDetail from "./DataDetail";
import { DataFilters } from "../../components";

const { Title } = Typography;

const ManageData = () => {
  const [loading, setLoading] = useState(false);
  const [dataset, setDataset] = useState([]);
  const [query, setQuery] = useState("");
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);

  const { administration, selectedForm, questionGroups } = store.useState(
    (state) => state
  );

  const selectedAdministration =
    administration.length > 0
      ? administration[administration.length - 1]
      : null;

  const columns = [
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      filtered: true,
      filteredValue: query.trim() === "" ? [] : [query],
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
    if (selectedForm) {
      setLoading(true);
      let url = `list/form-data/${selectedForm}/?page=${currentPage}`;
      if (selectedAdministration?.id) {
        url += `&administration=${selectedAdministration.id}`;
      }
      api
        .get(url)
        .then((res) => {
          setDataset(res.data.data);
          setTotalCount(res.data.total);
          setLoading(false);
        })
        .catch(() => {
          message.error("Could not load data");
          setLoading(false);
        });
    }
  }, [selectedForm, selectedAdministration, currentPage]);

  return (
    <div id="manageData">
      <Row justify="space-between">
        <Col>
          <Breadcrumb
            separator={
              <h2 className="ant-typography" style={{ display: "inline" }}>
                {">"}
              </h2>
            }
          >
            <Breadcrumb.Item>
              <Link to="/control-center">
                <Title style={{ display: "inline" }} level={2}>
                  Control Center
                </Title>
              </Link>
            </Breadcrumb.Item>
            <Breadcrumb.Item>
              <Title style={{ display: "inline" }} level={2}>
                Manage Data
              </Title>
            </Breadcrumb.Item>
          </Breadcrumb>
        </Col>
      </Row>
      <Divider />
      <DataFilters query={query} setQuery={setQuery} loading={loading} />
      <Divider />
      <Card
        style={{ padding: 0, minHeight: "40vh" }}
        bodyStyle={{ padding: 0 }}
      >
        <ConfigProvider
          renderEmpty={() => (
            <Empty
              description={selectedForm ? "No data" : "No form selected"}
            />
          )}
        >
          <Table
            columns={columns}
            dataSource={dataset}
            loading={loading}
            onChange={handleChange}
            pagination={{
              total: totalCount,
              pageSize: 10,
              showSizeChanger: false,
            }}
            rowKey="id"
            expandable={{
              expandedRowRender: (record) => (
                <DataDetail questionGroups={questionGroups} record={record} />
              ),
              expandIcon: ({ expanded, onExpand, record }) =>
                expanded ? (
                  <CloseSquareOutlined
                    onClick={(e) => onExpand(record, e)}
                    style={{ color: "#e94b4c" }}
                  />
                ) : (
                  <PlusSquareOutlined
                    onClick={(e) => onExpand(record, e)}
                    style={{ color: "#7d7d7d" }}
                  />
                ),
            }}
          />
        </ConfigProvider>
      </Card>
    </div>
  );
};

export default React.memo(ManageData);
