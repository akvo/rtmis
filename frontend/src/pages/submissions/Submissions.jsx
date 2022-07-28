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
import { api, store, uiText } from "../../lib";
import { useNotification } from "../../util/hooks";
import { columnsPending, columnsBatch, columnsSelected } from "./";
import UploadDetail from "./UploadDetail";
import FormDropdown from "../../components/filters/FormDropdown";
const { TextArea } = Input;

const { TabPane } = Tabs;

const Submissions = () => {
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
  const { selectedForm, user } = store.useState((state) => state);
  const [batchName, setBatchName] = useState("");
  const [comment, setComment] = useState("");
  const { language } = store.useState((s) => s);
  const { active: activeLang } = language;
  const { notify } = useNotification();

  const pagePath = [
    {
      title: "Control Center",
      link: "/control-center",
    },
    {
      title: "Submissions",
      link: "/control-center",
    },
    {
      title: window.forms?.find((x) => x.id === selectedForm)?.name,
    },
  ];

  const text = useMemo(() => {
    return uiText[activeLang];
  }, [activeLang]);
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

  const handleOnClickBatchSelectedDataset = () => {
    // check only for data entry role
    if (user.role.id === 4) {
      api.get(`form/check-approver/${selectedForm}`).then((res) => {
        if (!res.data.count) {
          notify({
            type: "error",
            message: text.batchNoApproverMessage,
          });
        } else {
          setModalVisible(true);
        }
      });
    } else {
      setModalVisible(true);
    }
  };

  const btnBatchSelected = useMemo(() => {
    return (
      dataTab === "pending-submission" && (
        <Button
          type="primary"
          onClick={handleOnClickBatchSelectedDataset}
          disabled={!selectedRows.length && modalButton}
        >
          {text.batchSelectedDatasets}
        </Button>
      )
    );
  }, [selectedRows, modalButton, text.batchSelectedDatasets, dataTab]);

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
        setBatchName("");
        setComment("");
        setDataTab("pending-approval");
      })
      .catch(() => {
        notify({
          type: "error",
          message: "An error occured",
        });
      })
      .finally(() => {
        setLoading(false);
        setModalVisible(false);
      });
  };
  return (
    <div id="submissions">
      <Breadcrumbs pagePath={pagePath} />
      <Divider />
      <FormDropdown hidden={true} />
      <Card style={{ padding: 0 }} bodyStyle={{ padding: 30 }}>
        <Tabs
          className="main-tab"
          activeKey={dataTab}
          onChange={setDataTab}
          tabBarExtraContent={btnBatchSelected}
        >
          <TabPane tab={text.uploadsTab1} key="pending-submission"></TabPane>
          <TabPane tab={text.uploadsTab2} key="pending-approval"></TabPane>
          <TabPane tab={text.uploadsTab3} key="approved"></TabPane>
        </Tabs>
        <Table
          className="main-table"
          dataSource={dataset}
          onChange={handleChange}
          columns={
            dataTab === "pending-submission"
              ? [
                  ...columnsPending,
                  {
                    title: text.batchDatasets,
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
                    width: 180,
                    align: "center",
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
          expandable={
            dataTab !== "pending-submission"
              ? {
                  expandedRowRender: (record) => {
                    return (
                      <UploadDetail record={record} setReload={setReload} />
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
                }
              : false
          }
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
                <label>{text.batchName}</label>
                <Input
                  onChange={(e) => setBatchName(e.target.value)}
                  allowClear
                />
              </div>
              <label>{text.submissionComment}</label>
              <TextArea rows={4} onChange={(e) => setComment(e.target.value)} />
            </Col>
            <Col xs={12} align="left">
              <Checkbox className="dev">{text.sendNewRequest}</Checkbox>
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
                {text.createNewBatch}
              </Button>
            </Col>
          </Row>
        }
      >
        <p>{text.batchHintText}</p>
        <p>
          <FileTextFilled style={{ color: "#666666", fontSize: 64 }} />
        </p>
        <p>{text.batchHintDesc}</p>
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

export default React.memo(Submissions);
