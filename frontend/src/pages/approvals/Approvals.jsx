import React, { useEffect, useState } from "react";
import "./style.scss";
import { Row, Col, Card, Divider, Table, Tabs, Button } from "antd";
import { Breadcrumbs } from "../../components";
import { Link } from "react-router-dom";
import { PlusSquareOutlined, CloseSquareOutlined } from "@ant-design/icons";
import { api, store } from "../../lib";
import { columnsApproval } from "./";
import ApprovalDetails from "./ApprovalDetail";
import { ApprovalTour } from "./components";

const columns = [...columnsApproval, Table.EXPAND_COLUMN];

const pagePath = [
  {
    title: "Control Center",
    link: "/control-center",
  },
  {
    title: "Approvals",
  },
];
const { TabPane } = Tabs;

const Approvals = () => {
  const [batches, setBatches] = useState([]);
  const [approvalTab, setApprovalTab] = useState("my-pending");
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedKeys, setExpandedKeys] = useState([]);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reload, setReload] = useState(0);
  const { user } = store.useState((state) => state);

  useEffect(() => {
    setRole(user?.role?.id);
  }, [user]);

  useEffect(() => {
    setLoading(true);
    let url = `/form-pending-batch/?page=${currentPage}`;
    if (approvalTab === "subordinate") {
      url = `${url}&subordinate=true`;
    }
    if (approvalTab === "approved") {
      url = `${url}&approved=true`;
    }
    api
      .get(url)
      .then((res) => {
        setBatches(res.data.batch);
        setTotalCount(res.data.total);
        setLoading(false);
      })
      .catch((e) => {
        console.error(e);
        setLoading(false);
      });
  }, [approvalTab, currentPage, reload]);

  const handleChange = (e) => {
    setCurrentPage(e.current);
  };

  return (
    <div id="approvals">
      <Row justify="space-between">
        <Col>
          <Breadcrumbs pagePath={pagePath} />
        </Col>
        <Col>
          {(role === 1 || role === 2) && (
            <Link to={role === 1 ? "/questionnaires" : "/questionnaires/admin"}>
              <Button type="primary">Manage Questionnaire Approval</Button>
            </Link>
          )}
        </Col>
        <ApprovalTour />
      </Row>
      <Divider />
      <Card
        style={{ padding: 0, minHeight: "40vh" }}
        bodyStyle={{ padding: 30 }}
      >
        <Tabs defaultActiveKey={approvalTab} onChange={setApprovalTab}>
          <TabPane tab="My Pending Approvals" key="my-pending"></TabPane>
          <TabPane tab="Subordinates Approvals" key="subordinate"></TabPane>
          <TabPane tab="Approved" key="approved"></TabPane>
        </Tabs>
        <Table
          dataSource={batches}
          onChange={handleChange}
          columns={columns}
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
                <ApprovalDetails
                  record={record}
                  approve={approvalTab === "my-pending"}
                  setReload={setReload}
                  expandedParentKeys={expandedKeys}
                  setExpandedParentKeys={setExpandedKeys}
                  readonly={
                    record.approver?.status_text === "Rejected" || false
                  }
                />
              );
            },
            expandIcon: ({ expanded, onExpand, record }) =>
              expanded ? (
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
              ),
          }}
          rowKey="id"
        />
      </Card>
    </div>
  );
};

export default React.memo(Approvals);
