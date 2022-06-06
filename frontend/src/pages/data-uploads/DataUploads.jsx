import React, { useEffect, useState, useMemo } from "react";
import "./style.scss";
import {
  Card,
  Divider,
  Table,
  Tabs,
  Checkbox,
  Button,
  Modal,
  Row,
  Col,
  Input,
} from "antd";
import { Breadcrumbs } from "../../components";
import {
  PlusSquareOutlined,
  CloseSquareOutlined,
  FileTextFilled,
} from "@ant-design/icons";
import { api, store } from "../../lib";
import { columnsPending, columnsBatch, columnsSelected } from "./";
import UploadDetail from "./UploadDetail";
import FormDropdown from "../../components/filters/FormDropdown";
const { TextArea } = Input;

const pagePath = [
  {
    title: "Control Center",
    link: "/control-center",
  },
  {
    title: "Data Uploads",
  },
];
const { TabPane } = Tabs;

const DataUploads = () => {
  const [dataset, setDataset] = useState([]);
  const [dataTab, setDataTab] = useState("pending-submission");
  const [totalCount, setTotalCount] = useState(0);
  const [modalButton, setModalButton] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedKeys, setExpandedKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reload, setReload] = useState(0);
  const [selectedRows, setSelectedRows] = useState([]);
  const { selectedForm } = store.useState((state) => state);
  const [batchName, setBatchName] = useState("");
  const [comment, setComment] = useState("");
  useEffect(() => {
    if (selectedForm) {
      setLoading(true);
      let url;
      if (dataTab === "pending-submission") {
        url = `/form-pending-data/${selectedForm}/?page=${currentPage}`;
        setModalButton(true);
      } else if (dataTab === "pending-approval") {
        url = `/batch/?page=${currentPage}`;
        setModalButton(false);
      } else if (dataTab === "approved") {
        url = `batch/?page=${currentPage}&approved=true`;
        setModalButton(false);
      }
      api
        .get(url)
        .then((res) => {
          setDataset(res.data.data);
          setTotalCount(res.data.total);
        })
        .catch((e) => {
          console.error(e);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [dataTab, currentPage, reload, selectedForm]);

  useEffect(() => {
    if (selectedForm) {
      setSelectedRows([]);
    }
  }, [selectedForm]);

  const handleSelect = (row, checked) => {
    const current = selectedRows.filter((s) => s.id !== row.id);
    if (checked) {
      setSelectedRows([...current, row]);
    } else {
      setSelectedRows(current);
    }
  };
  const handleChange = (e) => {
    setCurrentPage(e.current);
  };

  const btnBatchSelected = useMemo(() => {
    if (!!selectedRows.length && modalButton) {
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
        setDataTab("pending-approval");
      })
      .catch(() => {
        setLoading(false);
        setModalVisible(false);
      });
  };
  return (
    <div id="uploads">
      <Breadcrumbs pagePath={pagePath} />
      <Divider />
      <FormDropdown hidden={true} />
      <Card
        style={{ padding: 0, minHeight: "40vh" }}
        bodyStyle={{ padding: 30 }}
      >
        <Tabs
          defaultActiveKey={dataTab}
          onChange={setDataTab}
          tabBarExtraContent={btnBatchSelected}
        >
          <TabPane tab="Pending Submission" key="pending-submission"></TabPane>
          <TabPane tab="Pending Approval" key="pending-approval"></TabPane>
          <TabPane tab="Approved" key="approved"></TabPane>
        </Tabs>
        <Table
          dataSource={dataset}
          onChange={handleChange}
          columns={
            dataTab === "pending-submission"
              ? [
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
                ]
              : [...columnsBatch, Table.EXPAND_COLUMN]
          }
          loading={loading}
          pagination={{
            current: currentPage,
            total: totalCount,
            pageSize: 10,
            showSizeChanger: false,
            showTotal: (total, range) =>
              `Results: ${range[0]} - ${range[1]} of ${total} users`,
          }}
          expandedRowKeys={expandedKeys}
          expandable={{
            expandedRowRender: (record) => {
              return (
                <UploadDetail
                  record={record}
                  setReload={setReload}
                />
              );
            },
            expandIcon: ({ expanded, onExpand, record }) => {
              return dataTab === "pending-submission" ? (
                ""
              ) : expanded ? (
                <CloseSquareOutlined
                  onClick={(e) => {
                    setExpandedKeys(
                      expandedKeys.filter((k) => k !== record.id)
                    );
                    onExpand(record, e);
                  }}
                  style={{ color: "#e94b4c" }}
                />
              ) : (
                <PlusSquareOutlined
                  onClick={(e) => {
                    setExpandedKeys([record.id]);
                    onExpand(record, e);
                  }}
                  style={{ color: "#7d7d7d" }}
                />
              );
            },
          }}
          rowKey="id"
        />
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
    </div>
  );
};

export default React.memo(DataUploads);
