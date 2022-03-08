import React, { useEffect, useState } from "react";
import "./style.scss";
import { Row, Col, Card, Divider, Table, Tabs, Button } from "antd";
import { Breadcrumbs } from "../../components";
import { Link } from "react-router-dom";
import { PlusSquareOutlined, CloseSquareOutlined } from "@ant-design/icons";
import { api, store } from "../../lib";
import { columnsApproval } from "./";
import ApprovalDetails from "./ApprovalsDetail";

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

const approvalsSubordinates = [];

const Approvals = () => {
  const [approvalsPending, setApprovalsPending] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [detailLoading, setDetailLoading] = useState(false);
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
    api
      .get(`/form-pending-batch/?page=${currentPage}`)
      .then((res) => {
        setApprovalsPending(res.data.batch);
        setTotalCount(res.data.total);
        setLoading(false);
      })
      .catch((e) => {
        console.error(e);
        setLoading(false);
      });
  }, [currentPage, reload]);

  const handleChange = (e) => {
    setCurrentPage(e.current);
  };

  const getDataDetail = (expanded, record) => {
    const oldDataset = approvalsPending.find((d) => d.id === record.id);
    if (expanded && !oldDataset?.answer) {
      setDetailLoading(true);
      api
        .get(`/form-pending-data-batch/${record.id}`)
        .then((res) => {
          const newDataset = approvalsPending.map((d) => {
            if (d.id === record.id) {
              d = { ...d, data: res.data };
            }
            return d;
          });
          setApprovalsPending(newDataset);
          setDetailLoading(false);
        })
        .catch((e) => {
          console.error(e);
        });
    }
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
      </Row>
      <Divider />
      <Card
        style={{ padding: 0, minHeight: "40vh" }}
        bodyStyle={{ padding: 30 }}
      >
        <Tabs defaultActiveKey="1" onChange={() => {}}>
          <TabPane tab="My Pending Approvals" key="1">
            <Table
              dataSource={approvalsPending}
              onChange={handleChange}
              columns={columns}
              loading={loading}
              pagination={{
                current: currentPage,
                total: totalCount,
                pageSize: 10,
                showSizeChanger: false,
              }}
              expandable={{
                onExpand: getDataDetail,
                expandedRowRender: (record) => (
                  <ApprovalDetails
                    record={record}
                    loading={detailLoading}
                    setReload={setReload}
                  />
                ),
                expandIcon: ({ expanded, onExpand, record }) =>
                  expanded ? (
                    <CloseSquareOutlined
                      onClick={(e) => {
                        setExpandedKeys(
                          expandedKeys.filter((k) => k !== record.key)
                        );
                        onExpand(record, e);
                      }}
                      style={{ color: "#e94b4c" }}
                    />
                  ) : (
                    <PlusSquareOutlined
                      onClick={(e) => {
                        setExpandedKeys(expandedKeys.concat(record.key));
                        onExpand(record, e);
                      }}
                      style={{ color: "#7d7d7d" }}
                    />
                  ),
              }}
              onRow={({ key }) =>
                expandedKeys.includes(key) && {
                  className: "table-row-expanded",
                }
              }
            />
          </TabPane>
          <TabPane tab="Subordinates Approvals" key="2">
            <Table
              className="dev"
              dataSource={approvalsSubordinates}
              loading={loading}
              columns={columns}
            />
          </TabPane>
        </Tabs>
      </Card>
    </div>
  );
};

export default React.memo(Approvals);
