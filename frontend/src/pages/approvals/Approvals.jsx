import React, { useEffect, useState, useMemo } from "react";
import "./style.scss";
import { Row, Col, Table, Tabs, Button } from "antd";
import { Breadcrumbs } from "../../components";
import { Link } from "react-router-dom";
import { PlusSquareOutlined, CloseSquareOutlined } from "@ant-design/icons";
import { api, store, uiText, config } from "../../lib";
import { columnsApproval } from "./";
import ApprovalDetails from "./ApprovalDetail";

const columns = [...columnsApproval, Table.EXPAND_COLUMN];

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
  const { language } = store.useState((s) => s);
  const { approvalsLiteral } = config;
  const { active: activeLang } = language;
  const text = useMemo(() => {
    return uiText[activeLang];
  }, [activeLang]);

  const pagePath = [
    {
      title: "Control Center",
      link: "/control-center",
    },
    {
      title: approvalsLiteral(user),
    },
  ];

  const panelItems = useMemo(() => {
    const items = [
      {
        key: "my-pending",
        label: text.approvalsTab1,
      },
      {
        key: "subordinate",
        label: text.approvalsTab2,
      },
      {
        key: "approved",
        label: text.approvalsTab3,
      },
    ];

    if (user.role_detail.name === "Super Admin") {
      return items.filter((item) => item.key !== "subordinate");
    }

    return items;
  }, [text, user]);

  const finalApproval = useMemo(() => {
    if (user.role.id === 2 && approvalTab === "approved") {
      return true;
    }
    return false;
  }, [user, approvalTab]);

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
      <div className="description-container">
        <Row justify="space-between">
          <Col>
            <Breadcrumbs pagePath={pagePath} />
          </Col>
          <Col>
            {(role === 1 || role === 2) && (
              <Link
                to={
                  role === 1
                    ? "/control-center/questionnaires"
                    : "/control-center/questionnaires/admin"
                }
              >
                <Button type="primary" shape="round">
                  {text.manageQnApproval}
                </Button>
              </Link>
            )}
          </Col>
        </Row>
      </div>
      <div className="table-section">
        <div className="table-wrapper">
          <div
            style={{ padding: 0, minHeight: "40vh" }}
            bodystyle={{ padding: 30 }}
          >
            <Tabs
              defaultActiveKey={approvalTab}
              items={panelItems}
              onChange={setApprovalTab}
            />
            <Table
              dataSource={batches}
              onChange={handleChange}
              columns={
                finalApproval
                  ? columns.filter((c) => c.key !== "waiting_on")
                  : columns
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(Approvals);
