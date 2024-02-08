import React, { useState, useEffect, useMemo } from "react";
import { Table, Tabs, Button, Space, List, Spin } from "antd";
import {
  LeftCircleOutlined,
  DownCircleOutlined,
  LoadingOutlined,
  HistoryOutlined,
} from "@ant-design/icons";
import { api, store, uiText } from "../../lib";
import { EditableCell } from "../../components";
import { isEqual, flatten } from "lodash";
import { useNotification } from "../../util/hooks";
import { HistoryTable } from "../../components";
import { columnsApprover } from "./";
import { getTimeDifferenceText } from "../../util/date";
const { TabPane } = Tabs;

const columnsRawData = [
  {
    title: "",
    dataIndex: "key",
    key: "key",
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

const UploadDetail = ({ record, setReload }) => {
  const [values, setValues] = useState([]);
  const [rawValues, setRawValues] = useState([]);
  const [columns, setColumns] = useState(summaryColumns);
  const [loading, setLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(null);
  const [saving, setSaving] = useState(null);
  const [selectedTab, setSelectedTab] = useState("data-summary");
  const [expandedRowKeys, setExpandedRowKeys] = useState([]);
  const [comments, setComments] = useState([]);
  const [questionGroups, setQuestionGroups] = useState([]);
  const [resetButton, setresetButton] = useState({});
  const { notify } = useNotification();
  const { user } = store.useState((state) => state);
  const { language } = store.useState((s) => s);
  const { active: activeLang } = language;
  const text = useMemo(() => {
    return uiText[activeLang];
  }, [activeLang]);

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
          formData.push({
            question: rq.id,
            value: value,
          });
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
        setReload(data.id);
        notify({
          type: "success",
          message: "Data updated",
        });
        const resetObj = {};
        formData.map((d) => {
          resetObj[d.question] = false;
        });
        setresetButton({ ...resetButton, ...resetObj });
      })
      .catch((e) => {
        console.error(e);
      })
      .finally(() => {
        setSaving(null);
      });
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
    setresetButton({ ...resetButton, [key]: true });
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
            question: qg.question.map((q) => {
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

  const ApproverDetail = () => (
    <Table
      columns={columnsApprover}
      dataSource={record.approvers?.map((r, ri) => ({
        key: ri,
        ...r,
      }))}
      pagination={false}
    />
  );

  const isEdited = (id) => {
    return (
      !!flatten(
        rawValues.find((d) => d.id === id)?.data?.map((g) => g.question)
      )?.filter(
        (d) => (d.newValue || d.newValue === 0) && !isEqual(d.value, d.newValue)
      )?.length || false
    );
  };

  const isEditable =
    (record.approvers || []).filter((a) => a.status_text === "Rejected")
      .length > 0 && user?.role?.id === 4;

  return (
    <div>
      <ApproverDetail />
      <Tabs centered activeKey={selectedTab} onTabClick={handleTabSelect}>
        <TabPane tab={text.uploadTab1} key="data-summary" />
        <TabPane tab={text.uploadTab2} key="raw-data" />
      </Tabs>
      <Table
        loading={loading}
        dataSource={selectedTab === "raw-data" ? rawValues : values}
        columns={columns}
        rowClassName={(record) =>
          (record.newValue || record.newValue === 0) &&
          !isEqual(record.value, record.newValue)
            ? "row-edited"
            : "row-normal sticky"
        }
        style={{ borderBottom: "solid 1px #ddd" }}
        rowKey="id"
        expandable={
          selectedTab === "raw-data"
            ? {
                expandedRowKeys,
                expandedRowRender: (expanded) => {
                  return (
                    <>
                      {expanded.loading ? (
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
                          {expanded.data?.map((r, rI) => (
                            <div className="pending-data-wrapper" key={rI}>
                              <h3>{r.name}</h3>
                              <Table
                                pagination={false}
                                dataSource={r.question}
                                rowClassName={(row) =>
                                  (row.newValue || row.newValue === 0) &&
                                  !isEqual(row.newValue, row.value)
                                    ? "row-edited"
                                    : "row-normal"
                                }
                                rowKey="id"
                                columns={[
                                  {
                                    title: "Question",
                                    dataIndex: "name",
                                    width: "50%",
                                  },
                                  {
                                    title: "Response",
                                    render: (row) => (
                                      <EditableCell
                                        record={row}
                                        parentId={expanded.id}
                                        updateCell={updateCell}
                                        resetCell={resetCell}
                                        disabled={!!dataLoading}
                                        readonly={!isEditable}
                                        resetButton={resetButton}
                                      />
                                    ),
                                    width: "50%",
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
                        </div>
                      )}
                      {isEditable && !expanded.loading && (
                        <div className="pending-data-actions">
                          <Button
                            onClick={() => handleSave(expanded)}
                            type="primary"
                            loading={expanded.id === saving}
                            disabled={
                              expanded.id === dataLoading ||
                              isEdited(expanded.id) === false
                            }
                          >
                            Save Edits
                          </Button>
                        </div>
                      )}
                    </>
                  );
                },
                expandIcon: ({ expanded, onExpand, record }) =>
                  expanded ? (
                    <DownCircleOutlined
                      onClick={(e) => {
                        setExpandedRowKeys([]);
                        onExpand(record, e);
                      }}
                      style={{ color: "#1651B6", fontSize: "19px" }}
                    />
                  ) : (
                    <LeftCircleOutlined
                      onClick={(e) => {
                        setExpandedRowKeys([record.id]);
                        if (!record.data?.length) {
                          initData(record.id);
                        }
                        onExpand(record, e);
                      }}
                      style={{ color: "#1651B6", fontSize: "19px" }}
                    />
                  ),
              }
            : false
        }
      />
      <h3>{text.notesFeedback}</h3>
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
                    <div style={{ fontSize: "12px" }}>
                      {item.user.name}
                      <span style={{ color: "#ACAAAA", marginLeft: "6px" }}>
                        {getTimeDifferenceText(
                          item.created,
                          "YYYY-MM-DD hh:mm a"
                        )}
                      </span>
                    </div>
                  }
                  description={item.comment}
                />
              </List.Item>
            )}
          />
        </div>
      )}
    </div>
  );
};

export default React.memo(UploadDetail);
