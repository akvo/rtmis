import React, { useEffect, useState } from "react";
import "./style.scss";
import { Card, Divider, Table, Tabs } from "antd";
import { Breadcrumbs } from "../../components";
import { PlusSquareOutlined, CloseSquareOutlined } from "@ant-design/icons";
import { api } from "../../lib";
import { columnsApproval } from "./";
import UploadDetail from "./UploadDetail";

const columns = [...columnsApproval, Table.EXPAND_COLUMN];

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
  const [batches, setBatches] = useState([]);
  const [approvalTab, setApprovalTab] = useState("pending-submission");
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedKeys, setExpandedKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    setLoading(true);
    let url = `/form-pending-batch/?page=${currentPage}`;
    if (approvalTab === "pending-approval") {
      url = `${url}&pending-approval=true`;
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
      <Breadcrumbs pagePath={pagePath} />
      <Divider />
      <Card
        style={{ padding: 0, minHeight: "40vh" }}
        bodyStyle={{ padding: 30 }}
      >
        <Tabs defaultActiveKey={approvalTab} onChange={setApprovalTab}>
          <TabPane tab="Pending Submission" key="pending-submission"></TabPane>
          <TabPane tab="Pending Approval" key="pending-approval"></TabPane>
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
                <UploadDetail
                  record={record}
                  approve={approvalTab === "pending-submission"}
                  setReload={setReload}
                  expandedParentKeys={expandedKeys}
                  setExpandedParentKeys={setExpandedKeys}
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

export default React.memo(DataUploads);
