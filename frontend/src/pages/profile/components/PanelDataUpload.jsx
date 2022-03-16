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
  Tag,
  Popover,
} from "antd";
import {
  PlusSquareOutlined,
  CloseSquareOutlined,
  FileTextFilled,
  InfoCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";
import { DataFilters } from "../../../components";
import { api, store } from "../../../lib";

const { TabPane } = Tabs;
const { TextArea } = Input;

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
    align: "center",
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
    title: "Status",
    dataIndex: "approvers",
    key: "approvers",
    align: "center",
    render: (approvers) => {
      if (approvers?.length) {
        const status_text = approvers[0].status_text;
        return (
          <span>
            <Tag
              icon={
                status_text === "Pending" ? (
                  <ClockCircleOutlined />
                ) : status_text === "Rejected" ? (
                  <CloseCircleOutlined />
                ) : (
                  <CheckCircleOutlined />
                )
              }
              color={
                status_text === "Pending"
                  ? "default"
                  : status_text === "Rejected"
                  ? "error"
                  : "success"
              }
            >
              {status_text}
            </Tag>
          </span>
        );
      }
      return (
        <span>
          <Popover
            content="There is no approvers for this data, please contact admin"
            title="No Approver"
          >
            <Tag color="warning" icon={<ExclamationCircleOutlined />}>
              No Approver
            </Tag>
          </Popover>
        </span>
      );
    },
  },
  {
    title: "Total Data",
    dataIndex: "total_data",
    key: "total_data",
    align: "center",
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

const columnsApprover = [
  {
    title: "Approver",
    dataIndex: "name",
    key: "name",
  },
  {
    title: "Administration",
    dataIndex: "administration",
    key: "administration",
  },
  {
    title: "Status",
    dataIndex: "status_text",
    key: "status_text",
    render: (status_text) => (
      <span>
        <Tag
          icon={
            status_text === "Pending" ? (
              <ClockCircleOutlined />
            ) : status_text === "Rejected" ? (
              <CloseCircleOutlined />
            ) : (
              <CheckCircleOutlined />
            )
          }
          color={
            status_text === "Pending"
              ? "default"
              : status_text === "Rejected"
              ? "error"
              : "success"
          }
        >
          {status_text}
        </Tag>
      </span>
    ),
  },
];

const ApproverDetail = (record) => {
  return (
    <Table
      columns={columnsApprover}
      dataSource={record.approvers.map((r, ri) => ({
        key: ri,
        ...r,
      }))}
      pagination={false}
    />
  );
};

const PanelDataUpload = () => {
  const [dataset, setDataset] = useState([]);
  const [expandedKeys, setExpandedKeys] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedRows, setSelectedRows] = useState([]);
  const [selectedTab, setSelectedTab] = useState("pending-data");
  const [batchName, setBatchName] = useState("");
  const [modalButton, setModalButton] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [comment, setComment] = useState("");

  const { selectedForm } = store.useState((state) => state);

  useEffect(() => {
    let url = `form-pending-data/${selectedForm}/?page=${currentPage}`;
    if (selectedTab === "pending-data") {
      setExpandedKeys([]);
      setModalButton(true);
    }
    if (selectedTab === "pending-batch") {
      url = `batch/?page=${currentPage}`;
      setModalButton(false);
    }
    setLoading(true);
    api
      .get(url)
      .then((res) => {
        setDataset(res.data.data);
        setTotalCount(res.data.total);
        setLoading(false);
      })
      .catch(() => {
        setDataset([]);
        setTotalCount(0);
        setLoading(false);
      });
  }, [selectedTab, selectedForm, currentPage]);

  useEffect(() => {
    if (selectedForm) {
      setSelectedRows([]);
    }
  }, [selectedForm]);

  useEffect(() => {
    if (selectedTab) {
      setDataset([]);
    }
  }, [selectedTab]);

  const handlePageChange = (e) => {
    setCurrentPage(e.current);
  };

  const handleSelect = (row, checked) => {
    const current = selectedRows.filter((s) => s.id !== row.id);
    if (checked) {
      setSelectedRows([...current, row]);
    } else {
      setSelectedRows(current);
    }
  };

  const sendBatch = () => {
    setLoading(true);
    const payload = { name: batchName, data: selectedRows.map((x) => x.id) };
    api
      .post(
        "batch",
        comment.length ? { ...payload, comment: comment } : payload
      )
      .then(() => {
        setSelectedRows([]);
        setModalVisible(false);
        setLoading(false);
        setSelectedTab("pending-batch");
      })
      .catch(() => {
        setLoading(false);
        setModalVisible(false);
      });
  };

  const btnBatchSelected = useMemo(() => {
    if (selectedRows.length && modalButton) {
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
  }, [selectedRows, modalButton]);

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
          activeKey={selectedTab}
          defaultActiveKey={selectedTab}
          onChange={setSelectedTab}
          tabBarExtraContent={btnBatchSelected}
        >
          <TabPane tab="Pending Submission" key={"pending-data"}>
            <Table
              loading={loading}
              dataSource={dataset}
              columns={[
                ...columnsPending,
                {
                  title: "Batch Datasets",
                  render: (row) => (
                    <Checkbox
                      checked={
                        selectedRows.filter((s) => s.id === row.id).length
                      }
                      onChange={(e) => {
                        handleSelect(row, e.target.checked);
                      }}
                    />
                  ),
                },
              ]}
              onChange={handlePageChange}
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
              dataSource={dataset}
              columns={[...columnsBatch, Table.EXPAND_COLUMN]}
              onChange={handlePageChange}
              pagination={{
                current: currentPage,
                total: totalCount,
                pageSize: 10,
                showSizeChanger: false,
              }}
              rowKey="id"
              expandedRowKeys={expandedKeys}
              expandable={{
                expandedRowRender: ApproverDetail,
                expandIcon: (expand) => {
                  return expand.expanded ? (
                    <CloseSquareOutlined
                      onClick={() => setExpandedKeys([])}
                      style={{ color: "#e94b4c" }}
                    />
                  ) : (
                    <PlusSquareOutlined
                      onClick={() => setExpandedKeys([expand.record.id])}
                      style={{ color: "#7d7d7d" }}
                    />
                  );
                },
              }}
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
            <Col xs={24} align="left">
              <div className="batch-name-field">
                <label>Batch Name</label>
                <Input
                  onChange={(e) => setBatchName(e.target.value)}
                  allowClear
                />
              </div>
              <label>Submission comment (Optional)</label>
              <TextArea rows={4} onChange={(e) => setComment(e.target.value)} />
            </Col>
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
