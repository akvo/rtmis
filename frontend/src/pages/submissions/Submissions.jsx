import React, { useEffect, useState, useMemo } from "react";
import "./style.scss";
import { Table, Tabs, Checkbox, Button, Modal, Row, Col, Input } from "antd";
import { Breadcrumbs } from "../../components";
import {
  PlusSquareOutlined,
  MinusSquareOutlined,
  FileTextFilled,
  ExclamationCircleOutlined,
} from "@ant-design/icons";
import { api, store, uiText } from "../../lib";
import { useNotification } from "../../util/hooks";
import { columnsBatch, columnsSelected } from "./";
import UploadDetail from "./UploadDetail";
import BatchDetail from "./BatchDetail";
import FormDropdown from "../../components/filters/FormDropdown";
import { isEmpty, union, xor } from "lodash";

const { TextArea } = Input;

const { TabPane } = Tabs;
const { confirm } = Modal;

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
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [deleting, setDeleting] = useState(false);
  const { selectedForm, user } = store.useState((state) => state);
  const [batchName, setBatchName] = useState("");
  const [comment, setComment] = useState("");
  const { language } = store.useState((s) => s);
  const { active: activeLang } = language;
  const { notify } = useNotification();

  const text = useMemo(() => {
    return uiText[activeLang];
  }, [activeLang]);

  const pagePath = [
    {
      title: text.controlCenter,
      link: "/control-center",
    },
    {
      title: text.submissionsText,
      link: "/control-center",
    },
    {
      title: window.forms?.find((x) => x.id === selectedForm)?.name,
    },
  ];

  const columnsPending = [
    {
      title: "",
      dataIndex: "id",
      key: "id",
      render: () => "",
      width: 50,
    },
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      render: (name, row) => (
        <Row align="middle" gutter={16}>
          <Col>
            <FileTextFilled
              style={{ color: "#666666", fontSize: 28, paddingRight: "1rem" }}
            />
          </Col>
          <Col>
            <div>{name}</div>
            <div>{row.created}</div>
          </Col>
        </Row>
      ),
    },
    {
      title: "Administration",
      dataIndex: "administration",
      key: "administration",
    },
    {
      title: "Submitted Date",
      dataIndex: "created",
      key: "created",
      render: (created) => created || "",
      align: "center",
      width: 200,
    },
    {
      title: "Submitter Name",
      dataIndex: "submitter",
      key: "submitter",
      render: (submitter, dt) => {
        return submitter || dt.created_by;
      },
    },
    {
      title: "Duration",
      dataIndex: "duration",
      key: "duration",
      render: (duration) => duration || "",
      align: "center",
      width: 100,
    },
    {
      title: "Action",
      dataIndex: "#",
      key: "duration",
      render: (_, row) => (
        <div
          onClick={() => {
            confirm({
              title: "Are you sure to delete this batch?",
              icon: <ExclamationCircleOutlined />,
              content: "Once you have deleted you can't get it back",
              okText: "Yes",
              okType: "danger",
              cancelText: "No",
              onOk() {
                handleDelete(row);
              },
              onCancel() {
                return;
              },
            });
          }}
        >
          <Button shape="round" type="danger" ghost>
            {text.deleteText}
          </Button>
        </div>
      ),
      align: "center",
      width: 100,
    },
  ];

  useEffect(() => {
    if (selectedForm) {
      setLoading(true);
      let url;
      setExpandedKeys([]);
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
      setExpandedKeys([]);
      setSelectedRows([]);
      setSelectedRowKeys([]);
    }
  }, [selectedForm, dataTab]);

  useEffect(() => {
    if (dataset.length) {
      const selectedDataset = selectedRowKeys.map((s) => {
        const findData = dataset.find((d) => d.id === s);
        return findData;
      });
      setSelectedRows(selectedDataset);
    }
  }, [dataset, selectedRowKeys]);

  const handleChange = (e) => {
    setCurrentPage(e.current);
  };

  const btnBatchSelected = useMemo(() => {
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
    return (
      dataTab === "pending-submission" && (
        <Button
          type="primary"
          shape="round"
          onClick={handleOnClickBatchSelectedDataset}
          disabled={!selectedRows.length && modalButton}
        >
          {text.batchSelectedDatasets}
        </Button>
      )
    );
  }, [
    selectedRows,
    modalButton,
    text.batchSelectedDatasets,
    dataTab,
    notify,
    selectedForm,
    text.batchNoApproverMessage,
    user.role.id,
  ]);

  const hasSelected = !isEmpty(selectedRowKeys);
  const onSelectTableRow = (val) => {
    setSelectedRowKeys(val);
  };

  const onSelectAllTableRow = (isSelected) => {
    const ids = dataset.filter((x) => !x?.disabled).map((x) => x.id);
    if (!isSelected && hasSelected) {
      setSelectedRowKeys(xor(selectedRowKeys, ids));
    }
    if (isSelected && !hasSelected) {
      setSelectedRowKeys(ids);
    }
    if (isSelected && hasSelected) {
      setSelectedRowKeys(union(selectedRowKeys, ids));
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
        setSelectedRowKeys([]);
        setBatchName("");
        setComment("");
        setDataTab("pending-approval");
      })
      .catch(() => {
        notify({
          type: "error",
          message: text.notifyError,
        });
      })
      .finally(() => {
        setLoading(false);
        setModalVisible(false);
      });
  };

  const handleDelete = (rowInfo) => {
    setDeleting(true);
    api
      .delete(`pending-data/${rowInfo.id}`, { pending_data_id: rowInfo.id })
      .then(() => {
        setDataset(dataset.filter((d) => d.id !== rowInfo.id));
        setDeleting(false);
        notify({
          type: "success",
          message: "Batch deleted",
        });
      })
      .catch((err) => {
        const { status, data } = err.response;
        if (status === 409) {
          notify({
            type: "error",
            message: data?.message || text.userDeleteFail,
          });
        } else {
          notify({
            type: "error",
            message: text.userDeleteFail,
          });
        }
        setDeleting(false);
        console.error(err.response);
      });
  };

  return (
    <div id="submissions">
      <div className="description-container">
        <Breadcrumbs pagePath={pagePath} />
      </div>
      <div className="table-section">
        <div className="table-wrapper">
          <FormDropdown hidden={true} />
          <div style={{ padding: 0 }} bodystyle={{ padding: 30 }}>
            <Tabs
              className="main-tab"
              activeKey={dataTab}
              onChange={setDataTab}
              tabBarExtraContent={btnBatchSelected}
            >
              <TabPane
                tab={text.uploadsTab1}
                key="pending-submission"
              ></TabPane>
              <TabPane tab={text.uploadsTab2} key="pending-approval"></TabPane>
              <TabPane tab={text.uploadsTab3} key="approved"></TabPane>
            </Tabs>
            <Table
              className="main-table"
              dataSource={dataset}
              onChange={handleChange}
              columns={
                dataTab === "pending-submission"
                  ? [...columnsPending, Table.EXPAND_COLUMN]
                  : [...columnsBatch, Table.EXPAND_COLUMN]
              }
              rowSelection={
                dataTab === "pending-submission"
                  ? {
                      selectedRowKeys: selectedRowKeys,
                      onChange: onSelectTableRow,
                      onSelectAll: onSelectAllTableRow,
                      handleDelete: handleDelete,
                      getCheckboxProps: (record) => ({
                        disabled: record?.disabled,
                      }),
                    }
                  : false
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
                  if (dataTab === "pending-submission") {
                    return (
                      <BatchDetail
                        expanded={record}
                        setReload={setReload}
                        setDataset={setDataset}
                        dataset={dataset}
                        handleDelete={handleDelete}
                        deleting={deleting}
                      />
                    );
                  }
                  return <UploadDetail record={record} setReload={setReload} />;
                },
                expandIcon: ({ expanded, onExpand, record }) => {
                  return expanded ? (
                    <MinusSquareOutlined
                      onClick={(e) => {
                        setExpandedKeys(
                          expandedKeys.filter((k) => k !== record.id)
                        );
                        onExpand(record, e);
                      }}
                      style={{ color: "#e94b4c", fontSize: "16px" }}
                    />
                  ) : (
                    <PlusSquareOutlined
                      onClick={(e) => {
                        setExpandedKeys([record.id]);
                        onExpand(record, e);
                      }}
                      style={{ color: "#1651B6", fontSize: "16px" }}
                    />
                  );
                },
              }}
              rowKey="id"
            />
          </div>
        </div>
      </div>
      <Modal
        open={modalVisible}
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
              <Checkbox checked={true} disabled={true} className="dev">
                {text.sendNewRequest}
              </Checkbox>
            </Col>
            <Col xs={12}>
              <Button
                className="light"
                shape="round"
                onClick={() => {
                  setModalVisible(false);
                }}
              >
                {text.cancelButton}
              </Button>
              <Button
                type="primary"
                shape="round"
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
