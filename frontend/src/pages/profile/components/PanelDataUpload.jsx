import React, { useMemo, useState, useEffect } from "react";
import {
  Card,
  Table,
  Input,
  Tabs,
  Row,
  Button,
  Col,
  Checkbox,
  Modal,
} from "antd";
import { FileTextFilled, InfoCircleOutlined } from "@ant-design/icons";
import { DataFilters } from "../../../components";
import { api, store } from "../../../lib";

const { TabPane } = Tabs;

const columnsSelected = [
  {
    title: "Dataset",
    dataIndex: "name",
    key: "name",
  },
  {
    title: "Date Uploaded",
    dataIndex: "created",
    key: "created",
    align: "right",
  },
];

const columnsBatch = [
  {
    title: "",
    dataIndex: "id",
    key: "id",
    render: () => <InfoCircleOutlined />,
    width: 50,
  },
  {
    title: "Batch Name",
    dataIndex: "name",
    key: "name",
    render: (name, row) => (
      <Row align="middle">
        <Col>
          <FileTextFilled style={{ color: "#666666", fontSize: 28 }} />
        </Col>
        <Col>
          <div>{name}</div>
          <div>{row.created}</div>
        </Col>
      </Row>
    ),
  },
  {
    title: "Form",
    dataIndex: "form",
    key: "form",
    render: (form) => form.name || "",
  },
  {
    title: "Administration",
    dataIndex: "administration",
    key: "administration",
    render: (administration) => administration.name || "",
  },
  {
    title: "Total Data",
    dataIndex: "total_data",
    key: "total_data",
  },
];

const columnsPending = [
  {
    title: "",
    dataIndex: "id",
    key: "id",
    render: () => <InfoCircleOutlined />,
    width: 50,
  },
  {
    title: "Name",
    dataIndex: "name",
    key: "name",
    render: (name, row) => (
      <Row align="middle">
        <Col>
          <FileTextFilled style={{ color: "#666666", fontSize: 28 }} />
        </Col>
        <Col>
          <div>{name}</div>
          <div>{row.created}</div>
        </Col>
      </Row>
    ),
  },
  {
    title: "administration",
    dataIndex: "administration",
    key: "administration",
  },
];

const PanelDataUpload = () => {
  const [datasetPending, setDatasetPending] = useState([]);
  const [datasetBatch, setDatasetBatch] = useState([]);
  const [selectedRows, setSelectedRows] = useState([]);
  const [selectedTab, setSelectedTab] = useState("pending-data");
  const [batchName, setBatchName] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const { selectedForm } = store.useState((state) => state);

  useEffect(() => {
    if (selectedForm && selectedTab === "pending-data") {
      setLoading(true);
      const url = `form-pending-data/${selectedForm}/?page=${currentPage}`;
      api
        .get(url)
        .then((res) => {
          setDatasetPending(res.data.data);
          setTotalCount(res.data.total);
          setLoading(false);
        })
        .catch(() => {
          setDatasetPending([]);
          setTotalCount(0);
          setLoading(false);
        });
    }
  }, [datasetBatch, selectedTab, selectedForm, currentPage]);

  useEffect(() => {
    if (selectedTab === "pending-batch") {
      api
        .get("batch")
        .then((res) => {
          setDatasetBatch(res.data);
          setLoading(false);
        })
        .catch(() => {
          setLoading(false);
        });
    }
  }, [selectedTab]);

  const handlePageChange = (e) => {
    setCurrentPage(e.current);
  };

  const handleSelect = (row) => {
    const resultIndex = selectedRows.findIndex((sR) => sR.id === row.id);
    if (resultIndex === -1) {
      setSelectedRows([...selectedRows, row]);
    } else {
      const clonedRows = JSON.parse(JSON.stringify(selectedRows));
      clonedRows.splice(resultIndex, 1);
      setSelectedRows(clonedRows);
    }
  };

  const sendBatch = () => {
    setLoading(true);
    api
      .post("batch", { name: batchName, data: selectedRows.map((x) => x.id) })
      .then(() => {
        api
          .get("batch")
          .then((res) => {
            setDatasetBatch(res.data);
            setLoading(false);
            setModalVisible(false);
          })
          .catch(() => {
            setLoading(false);
            setModalVisible(false);
          });
      })
      .catch(() => {
        setLoading(false);
        setModalVisible(false);
      });
  };

  const btnBatchSelected = useMemo(() => {
    if (selectedRows.length > 0) {
      return (
        <Button
          type="primary"
          onClick={() => {
            setModalVisible(true);
          }}
        >
          Batch Selected Datasets
        </Button>
      );
    }
    return "";
  }, [selectedRows]);

  return (
    <>
      <Card
        style={{
          padding: 0,
          minHeight: "40vh",
        }}
      >
        <h1>Data Uploads</h1>
        <DataFilters />
        <Tabs
          defaultActiveKey={"pending-data"}
          onChange={setSelectedTab}
          tabBarExtraContent={btnBatchSelected}
        >
          <TabPane tab="Pending Submission" key={"pending-data"}>
            <Table
              loading={loading}
              dataSource={datasetPending}
              columns={[
                ...columnsPending,
                {
                  title: "Batch Datasets",
                  render: (row) => (
                    <Checkbox
                      onChange={() => {
                        handleSelect(row);
                      }}
                    />
                  ),
                },
              ]}
              onChange={handlePageChange}
              scroll={{ y: 500 }}
              pagination={{
                current: currentPage,
                total: totalCount,
                pageSize: 10,
                showSizeChanger: false,
              }}
              rowKey="id"
            />
          </TabPane>
          <TabPane tab="Pending Approval" key={"pending-batch"}>
            <Table
              loading={loading}
              dataSource={datasetBatch}
              columns={columnsBatch}
              pagination={false}
              scroll={{ y: 500 }}
              rowKey="id"
            />
          </TabPane>
        </Tabs>
      </Card>
      <Modal
        visible={modalVisible}
        onCancel={() => {
          setModalVisible(false);
        }}
        footer={
          <Row align="middle">
            <Col xs={12} align="left">
              <Checkbox className="dev">Send a new approval request</Checkbox>
            </Col>
            <Col xs={12}>
              <Button
                className="light"
                onClick={() => {
                  setModalVisible(false);
                }}
              >
                Cancel
              </Button>
              <Button
                type="primary"
                onClick={sendBatch}
                disabled={!batchName.length}
              >
                Create a new batch
              </Button>
            </Col>
          </Row>
        }
      >
        <p>You are about to create a Batch CSV File</p>
        <p>
          <FileTextFilled style={{ color: "#666666", fontSize: 64 }} />
        </p>
        <p>
          The operation of merging datasets cannot be undone, and will Create a
          new batch that will require approval from you admin
        </p>
        <div className="batch-name-field">
          <Input
            onChange={(e) => setBatchName(e.target.value)}
            placeholder="Batch Name"
            allowClear
          />
        </div>
        <Table
          bordered
          size="small"
          dataSource={selectedRows}
          columns={columnsSelected}
          pagination={false}
          scroll={{ y: 270 }}
          rowKey="id"
        />
      </Modal>
    </>
  );
};

export default PanelDataUpload;
