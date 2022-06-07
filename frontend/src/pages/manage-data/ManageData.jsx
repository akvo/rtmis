import React, { useState, useEffect } from "react";
import "./style.scss";
import {
  Row,
  Col,
  Card,
  Divider,
  Table,
  ConfigProvider,
  Empty,
  Modal,
  Button,
  Space,
} from "antd";
import {
  PlusSquareOutlined,
  CloseSquareOutlined,
  ExclamationCircleOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import { api, store } from "../../lib";
import DataDetail from "./DataDetail";
import { DataFilters, Breadcrumbs, DescriptionPanel } from "../../components";
import { useNotification } from "../../util/hooks";

const pagePath = [
  {
    title: "Control Center",
    link: "/control-center",
  },
  {
    title: "Manage Data",
  },
];
const descriptionData = (
  <div>
    This section helps you to:
    <ul>
      <li>Add new data using webforms</li>
      <li>Bulk upload data using spreadsheets</li>
      <li>Export data</li>
    </ul>
  </div>
);
const ManageData = () => {
  const { notify } = useNotification();
  const [loading, setLoading] = useState(false);
  const [dataset, setDataset] = useState([]);
  const [query, setQuery] = useState("");
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [updateRecord, setUpdateRecord] = useState(false);
  const [deleteData, setDeleteData] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const { administration, selectedForm, questionGroups } = store.useState(
    (state) => state
  );

  const isAdministrationLoaded = administration.length;
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

  const handleDeleteData = () => {
    if (deleteData?.id) {
      setDeleting(true);
      api
        .delete(`data/${deleteData.id}`)
        .then(() => {
          notify({
            type: "success",
            message: `${deleteData.name} deleted`,
          });
          setDataset(dataset.filter((d) => d.id !== deleteData.id));
          setDeleteData(null);
        })
        .catch((err) => {
          notify({
            type: "error",
            message: "Could not delete datapoint",
          });
          console.error(err.response);
        })
        .finally(() => {
          setDeleting(false);
        });
    }
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedAdministration]);

  useEffect(() => {
    if (selectedForm && isAdministrationLoaded && !updateRecord) {
      setLoading(true);
      let url = `/form-data/${selectedForm}/?page=${currentPage}`;
      if (selectedAdministration?.id) {
        url += `&administration=${selectedAdministration.id}`;
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
    isAdministrationLoaded,
    updateRecord,
  ]);

  return (
    <div id="manageData">
      <Row justify="space-between">
        <Col>
          <Breadcrumbs pagePath={pagePath} />
          <DescriptionPanel description={descriptionData} />
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
                  updateRecord={updateRecord}
                  updater={setUpdateRecord}
                  setDeleteData={setDeleteData}
                />
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
      <Modal
        visible={deleteData}
        onCancel={() => setDeleteData(null)}
        centered
        width="575px"
        footer={
          <Row justify="center" align="middle">
            <Col span={14}>&nbsp;</Col>
            <Col span={10}>
              <Button
                className="light"
                disabled={deleting}
                onClick={() => {
                  setDeleteData(null);
                }}
              >
                Cancel
              </Button>
              <Button
                type="primary"
                danger
                loading={deleting}
                onClick={handleDeleteData}
              >
                Delete
              </Button>
            </Col>
          </Row>
        }
        bodyStyle={{ textAlign: "center" }}
      >
        <Space direction="vertical">
          <DeleteOutlined style={{ fontSize: "50px" }} />
          <p>
            You are about to delete <i>{`${deleteData?.name}`}</i> data.{" "}
            <b>Delete a datapoint also will delete the history</b>. Are you sure
            want to delete this datapoint?
          </p>
        </Space>
      </Modal>
    </div>
  );
};

export default React.memo(ManageData);
