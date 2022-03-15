import React, { useState, useEffect } from "react";
import { Row, Col, Table, Tabs, Input, Checkbox, Button, Space } from "antd";
import { api } from "../../lib";

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
          .map((val) => `${val.type} - ${val.total}`);
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
  const [columns, setColumns] = useState(summaryColumns);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState("data-summary");
  const [comment, setComment] = useState("");

  const handleApprove = (id, status) => {
    let payload = {
      batch: id,
      status: status,
    };
    if (comment.length) {
      payload = { ...payload, comment: comment };
    }
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
    if (expandedParentKeys.length) {
      setSelectedTab("data-summary");
    }
  }, [expandedParentKeys]);

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
          setValues(res.data.map((x) => ({ key: x.id, ...x })));
          setLoading(false);
        })
        .catch((e) => {
          console.error(e);
          setLoading(false);
        });
    }
  }, [selectedTab, record]);

  return (
    <div>
      <Tabs centered activeKey={selectedTab} onTabClick={setSelectedTab}>
        <TabPane tab="Data Summary" key="data-summary" />
        <TabPane tab="Raw Data" key="raw-data" />
      </Tabs>
      <Table
        loading={loading}
        dataSource={values}
        columns={columns}
        scroll={{ y: 500 }}
        pagination={false}
      />
      <label>Notes {"&"} Feedback</label>
      <TextArea
        rows={4}
        onChange={(e) => setComment(e.target.value)}
        disabled={!approve}
      />
      <Row justify="space-between">
        <Col>
          <Row>
            <Checkbox className="dev" id="informUser" onChange={() => {}}>
              Inform User of Changes
            </Checkbox>
          </Row>
        </Col>
        <Col>
          <Space>
            <Button
              type="danger"
              onClick={() => handleApprove(record.id, 3)}
              disabled={!approve}
            >
              Decline
            </Button>
            <Button
              type="primary"
              onClick={() => handleApprove(record.id, 2)}
              disabled={!approve}
            >
              Approve
            </Button>
          </Space>
        </Col>
      </Row>
    </div>
  );
};

export default ApprovalDetail;
