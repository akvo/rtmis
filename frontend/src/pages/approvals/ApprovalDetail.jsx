import React, { useState, useEffect, useMemo } from "react";
import {
  Row,
  Col,
  Table,
  Tabs,
  Input,
  Checkbox,
  Button,
  Space,
  Tag,
  List,
  Spin,
} from "antd";
import {
  PlusSquareOutlined,
  CloseSquareOutlined,
  LoadingOutlined,
  HistoryOutlined,
} from "@ant-design/icons";
import { api, store, config } from "../../lib";
import { EditableCell } from "../../components";
import { isEqual, flatten } from "lodash";
import { useNotification } from "../../util/hooks";
import { HistoryTable } from "../../components";
const { TextArea } = Input;
const { TabPane } = Tabs;

const columnsRawData = [
  {
    title: "",
    dataIndex: "key",
    key: "key",
    width: 40,
    render: (_, __, a) => {
      return a + 1;
    },
  },
  {
    title: "Name",
    dataIndex: "name",
    key: "name",
  },
  {
    title: "Administration",
    dataIndex: "administration",
    key: "administration",
    align: "center",
  },
  {
    title: "Date",
    dataIndex: "created",
    key: "created",
  },
  {
    title: "Upload By",
    dataIndex: "created_by",
    key: "created_by",
    width: 200,
  },
  Table.EXPAND_COLUMN,
];

const summaryColumns = [
  {
    title: "Question",
    dataIndex: "question",
    key: "question",
  },
  {
    title: "Value",
    dataIndex: "value",
    key: "value",
    render: (value, row) => {
      if (row.type === "Option" || row.type === "Multiple_Option") {
        const data = value
          .filter((x) => x.total)
          .map((val) => `${val.type} - (${val.total})`);
        return (
          <ul className="option-list">
            {data.map((d, di) => (
              <li key={di}>{d}</li>
            ))}
          </ul>
        );
      }
      return value;
    },
  },
];

const ApprovalDetail = ({
  record,
  approve,
  setReload,
  expandedParentKeys,
  setExpandedParentKeys,
}) => {
  const [values, setValues] = useState([]);
  const [rawValues, setRawValues] = useState([]);
  const [columns, setColumns] = useState(summaryColumns);
  const [loading, setLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(null);
  const [saving, setSaving] = useState(null);
  const [selectedTab, setSelectedTab] = useState("data-summary");
  const [expandedRowKeys, setExpandedRowKeys] = useState([]);
  const [comments, setComments] = useState([]);
  const [comment, setComment] = useState("");
  const [questionGroups, setQuestionGroups] = useState([]);
  const { notify } = useNotification();
  const [checkedState, setCheckedState] = useState(
    new Array(record.form?.approval_instructions?.action.length).fill(false)
  );

  const { user: authUser } = store.useState((s) => s);
  const { approvalsLiteral } = config;

  //for checking the null value
  const approveButtonEnable = useMemo(() => {
    if (record.form?.approval_instructions === null) {
      return false;
    }
    return !checkedState.every(Boolean);
  }, [record, checkedState]);

  const handleSave = (data) => {
    setSaving(data.id);
    const formData = [];
    data.data.map((rd) => {
      rd.question.map((rq) => {
        if (
          (rq.newValue || rq.newValue === 0) &&
          !isEqual(rq.value, rq.newValue)
        ) {
          let value = rq.newValue;
          if (rq.type === "number") {
            value =
              parseFloat(value) % 1 !== 0 ? parseFloat(value) : parseInt(value);
          }
          formData.push({ question: rq.id, value: value });
        }
      });
    });
    api
      .put(
        `form-pending-data/${record.form?.id}?pending_data_id=${data.id}`,
        formData
      )
      .then(() => {
        fetchData(data.id, questionGroups);
        notify({
          type: "success",
          message: "Data updated",
        });
      })
      .catch((e) => {
        console.error(e);
      })
      .finally(() => {
        setSaving(null);
      });
  };
  const handleApprove = (id, status) => {
    let payload = {
      batch: id,
      status: status,
    };
    if (!comment.length) {
      notify({
        type: "warning",
        message:
          "Please provide notes or feedback to decline or approved the submission",
      });
      return;
    }
    payload = { ...payload, comment: comment };
    api
      .post("pending-data/approve", payload)
      .then(() => {
        setExpandedParentKeys(
          expandedParentKeys.filter((e) => e !== record.id)
        );
        setReload(id);
      })
      .catch((e) => console.error(e));
  };

  useEffect(() => {
    setSelectedTab("data-summary");
    api.get(`/batch/comment/${record.id}`).then((res) => {
      setComments(res.data);
    });
  }, [record]);

  const handleTabSelect = (e) => {
    if (loading) {
      return;
    }
    if (e === "data-summary") {
      setColumns(summaryColumns);
    } else {
      setExpandedRowKeys([]);
      setColumns(columnsRawData);
    }
    setSelectedTab(e);
  };

  useEffect(() => {
    setLoading(true);
    if (selectedTab === "data-summary") {
      api
        .get(`/batch/summary/${record.id}`)
        .then((res) => {
          const data = res.data.map((r, i) => {
            return { key: `Q-${i}`, ...r };
          });
          setColumns(summaryColumns);
          setValues(data);
          setLoading(false);
        })
        .catch((err) => {
          console.error(err);
          setLoading(false);
        });
    }
    if (selectedTab === "raw-data") {
      api
        .get(`/form-pending-data-batch/${record.id}`)
        .then((res) => {
          setColumns(columnsRawData);
          setRawValues(
            res.data.map((x) => ({
              key: x.id,
              data: [],
              loading: false,
              ...x,
            }))
          );
          setLoading(false);
        })
        .catch((e) => {
          console.error(e);
          setLoading(false);
        });
    }
  }, [selectedTab, record]);

  const updateCell = (key, parentId, value) => {
    let prev = JSON.parse(JSON.stringify(rawValues));
    prev = prev.map((rI) => {
      let hasEdits = false;
      const data = rI.data.map((rd) => ({
        ...rd,
        question: rd.question.map((rq) => {
          if (rq.id === key && rI.id === parentId) {
            if (
              isEqual(rq.value, value) &&
              (rq.newValue || rq.newValue === 0)
            ) {
              delete rq.newValue;
            } else {
              rq.newValue = value;
            }
            const edited = !isEqual(rq.value, value);
            if (edited && !hasEdits) {
              hasEdits = true;
            }
            return rq;
          }
          if (
            (rq.newValue || rq.newValue === 0) &&
            !isEqual(rq.value, rq.newValue) &&
            !hasEdits
          ) {
            hasEdits = true;
          }
          return rq;
        }),
      }));
      return {
        ...rI,
        data,
        edited: hasEdits,
      };
    });
    setRawValues(prev);
  };

  const resetCell = (key, parentId) => {
    let prev = JSON.parse(JSON.stringify(rawValues));
    prev = prev.map((rI) => {
      let hasEdits = false;
      const data = rI.data.map((rd) => ({
        ...rd,
        question: rd.question.map((rq) => {
          if (rq.id === key && rI.id === parentId) {
            delete rq.newValue;
            return rq;
          }
          if (
            (rq.newValue || rq.newValue === 0) &&
            !isEqual(rq.value, rq.newValue) &&
            !hasEdits
          ) {
            hasEdits = true;
          }
          return rq;
        }),
      }));
      return {
        ...rI,
        data,
        edited: hasEdits,
      };
    });
    setRawValues(prev);
  };

  const initData = (recordId) => {
    setRawValues((rv) =>
      rv.map((rI) => (rI.id === recordId ? { ...rI, loading: true } : rI))
    );
    if (questionGroups.length < 1) {
      const qg = window.forms.find((f) => f.id === record.form?.id).content
        .question_group;
      setQuestionGroups(qg);
      fetchData(recordId, qg);
    } else {
      fetchData(recordId, questionGroups);
    }
  };

  const fetchData = (recordId, questionGroups) => {
    setDataLoading(recordId);
    api
      .get(`pending-data/${recordId}`)
      .then((res) => {
        const data = questionGroups.map((qg) => {
          return {
            ...qg,
            question: qg.question
              .filter((item) => !item?.display_only)
              .map((q) => {
                const findValue = res.data.find(
                  (d) => d.question === q.id
                )?.value;
                return {
                  ...q,
                  value: findValue || findValue === 0 ? findValue : null,
                  history:
                    res.data.find((d) => d.question === q.id)?.history || false,
                };
              }),
          };
        });
        setRawValues((rv) =>
          rv.map((rI) =>
            rI.id === recordId ? { ...rI, data, loading: false } : rI
          )
        );
      })
      .catch((e) => {
        console.error(e);
        setRawValues((rv) =>
          rv.map((rI) => (rI.id === recordId ? { ...rI, loading: false } : rI))
        );
      })
      .finally(() => {
        setDataLoading(null);
      });
  };

  const isEdited = (id) => {
    return (
      !!flatten(
        rawValues.find((d) => d.id === id)?.data?.map((g) => g.question)
      )?.filter(
        (d) => (d.newValue || d.newValue === 0) && !isEqual(d.value, d.newValue)
      )?.length || false
    );
  };

  const handleCheckboxChange = (position) => {
    const updatedCheckedState = checkedState.map((item, index) =>
      index === position ? !item : item
    );

    setCheckedState(updatedCheckedState);
  };

  return (
    <div>
      <Tabs centered activeKey={selectedTab} onTabClick={handleTabSelect}>
        <TabPane tab="Data Summary" key="data-summary" />
        <TabPane tab="Raw Data" key="raw-data" />
      </Tabs>
      <Table
        loading={loading}
        dataSource={selectedTab === "raw-data" ? rawValues : values}
        columns={columns}
        // scroll={{ y: 500 }}
        pagination={false}
        rowClassName={(record) =>
          record.edited ? "row-edited" : "row-normal sticky"
        }
        style={{ borderBottom: "solid 1px #ddd" }}
        rowKey="id"
        expandable={
          selectedTab === "raw-data"
            ? {
                expandedRowKeys,
                expandedRowRender: (record) => {
                  return (
                    <div>
                      {record.loading ? (
                        <Space
                          style={{ paddingTop: 18, color: "#9e9e9e" }}
                          size="middle"
                        >
                          <Spin
                            indicator={
                              <LoadingOutlined
                                style={{ color: "#1b91ff" }}
                                spin
                              />
                            }
                          />
                          <span>Loading..</span>
                        </Space>
                      ) : (
                        <div className={`pending-data-outer`}>
                          {record.data?.map((r, rI) => (
                            <div className="pending-data-wrapper" key={rI}>
                              <h3>{r.name}</h3>
                              <Table
                                pagination={false}
                                dataSource={r.question}
                                rowClassName={(record) =>
                                  (record.newValue || record.newValue === 0) &&
                                  !isEqual(record.newValue, record.value)
                                    ? "row-edited"
                                    : "row-normal sticky"
                                }
                                rowKey="id"
                                columns={[
                                  {
                                    title: "Question",
                                    dataIndex: "name",
                                  },
                                  {
                                    title: "Response",
                                    render: (row) => (
                                      <EditableCell
                                        record={row}
                                        parentId={record.id}
                                        updateCell={updateCell}
                                        resetCell={resetCell}
                                        disabled={!!dataLoading}
                                        readonly={!approve}
                                      />
                                    ),
                                  },
                                  Table.EXPAND_COLUMN,
                                ]}
                                expandable={{
                                  expandIcon: ({ onExpand, record }) => {
                                    if (!record?.history) {
                                      return "";
                                    }
                                    return (
                                      <HistoryOutlined
                                        className="expand-icon"
                                        onClick={(e) => onExpand(record, e)}
                                      />
                                    );
                                  },
                                  expandedRowRender: (record) => (
                                    <HistoryTable record={record} />
                                  ),
                                  rowExpandable: (record) => record?.history,
                                }}
                              />
                            </div>
                          ))}
                          <Button
                            onClick={() => handleSave(record)}
                            type="primary"
                            shape="round"
                            loading={record.id === saving}
                            disabled={
                              !approve ||
                              selectedTab !== "raw-data" ||
                              record.id === dataLoading ||
                              isEdited(record.id) === false
                            }
                          >
                            Save Edits
                          </Button>
                        </div>
                      )}
                    </div>
                  );
                },
                expandIcon: ({ expanded, onExpand, record }) =>
                  expanded ? (
                    <CloseSquareOutlined
                      onClick={(e) => {
                        setExpandedRowKeys([]);
                        onExpand(record, e);
                      }}
                      style={{ color: "#e94b4c" }}
                    />
                  ) : (
                    <PlusSquareOutlined
                      onClick={(e) => {
                        setExpandedRowKeys([record.id]);
                        if (!record.data?.length) {
                          initData(record.id);
                        }
                        onExpand(record, e);
                      }}
                      style={{ color: "#7d7d7d" }}
                    />
                  ),
              }
            : false
        }
      />
      <h3 style={{ paddingTop: "1rem" }}>Notes {"&"} Feedback</h3>
      {!!comments.length && (
        <div className="comments">
          <List
            itemLayout="horizontal"
            dataSource={comments}
            renderItem={(item) => (
              <List.Item>
                {/* TODO: Change Avatar */}
                <List.Item.Meta
                  title={
                    <div>
                      <Tag>{item.created}</Tag>
                      {item.user.name}
                    </div>
                  }
                  description={item.comment}
                />
              </List.Item>
            )}
          />
        </div>
      )}
      <TextArea
        rows={4}
        onChange={(e) => setComment(e.target.value)}
        disabled={!approve}
      />
      <Row justify="space-between">
        <Col style={{ marginTop: "20px" }} span={24}>
          <p>{record.form?.approval_instructions?.text}</p>
          <Space direction="vertical">
            {record.form?.approval_instructions?.action?.map((item, index) => (
              <div key={index}>
                <Checkbox
                  checked={checkedState[index]}
                  onChange={() => handleCheckboxChange(index)}
                >
                  {item}
                </Checkbox>
              </div>
            ))}
          </Space>
        </Col>
        <Col span={24}>
          <Space style={{ marginTop: "20px", float: "right" }}>
            <Button
              type="danger"
              onClick={() => handleApprove(record.id, 3)}
              disabled={!approve}
              shape="round"
            >
              Reject
            </Button>
            <Button
              type="primary"
              onClick={() => handleApprove(record.id, 2)}
              disabled={!approve || approveButtonEnable}
              shape="round"
            >
              {approvalsLiteral({ ...authUser, isButton: true })}
            </Button>
          </Space>
        </Col>
      </Row>
    </div>
  );
};

export default React.memo(ApprovalDetail);
