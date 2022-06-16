import React, { useState, useEffect, useMemo } from "react";
import { Card, Table, Tabs, Row, Button } from "antd";
import { api, store, config, uiText } from "../../../lib";
import { Link } from "react-router-dom";
import { columnsApproval } from "../../approvals";
import "./style.scss";
import { DescriptionPanel } from "../../../components";

const { TabPane } = Tabs;

const PanelApprovals = () => {
  const [approvalsPending, setApprovalsPending] = useState([]);
  const [approvalTab, setApprovalTab] = useState("my-pending");
  const [loading, setLoading] = useState(true);
  const { user: authUser } = store.useState((s) => s);
  const { language } = store.useState((s) => s);
  const { active: activeLang } = language;
  const text = useMemo(() => {
    return uiText[activeLang];
  }, [activeLang]);

  useEffect(() => {
    setLoading(true);
    let url = "/form-pending-batch/?page=1";
    if (approvalTab === "subordinate") {
      url = "/form-pending-batch/?page=1&subordinate=true";
    }
    api
      .get(url)
      .then((res) => {
        setApprovalsPending(res.data.batch);
        setLoading(false);
      })
      .catch((e) => {
        console.error(e);
        setLoading(false);
      });
  }, [approvalTab]);

  return (
    <Card bordered={false} id="panel-approvals">
      <div className="row">
        <div className="flex-1">
          <h2>Approvals</h2>
        </div>
        <div>
          <img src="/assets/approval.png" width={100} height={100} />
        </div>
      </div>
      <DescriptionPanel description={<div>{text.panelApprovalsDesc}</div>} />
      <Tabs defaultActiveKey={approvalTab} onChange={setApprovalTab}>
        <TabPane tab={text.approvalsTab1} key="my-pending"></TabPane>
        <TabPane tab={text.approvalsTab2} key="subordinate"></TabPane>
      </Tabs>
      <Table
        dataSource={approvalsPending}
        loading={loading}
        columns={columnsApproval}
        pagination={{ position: ["none", "none"] }}
        scroll={{ y: 270 }}
      />
      <Row justify="space-between" className="approval-links">
        <Link to="/approvals">
          <Button type="primary">View All</Button>
        </Link>
        {config.checkAccess(authUser?.role_detail, "approvers") && (
          <Link to="/approvers/tree">
            <Button type="primary">Manage Approvers</Button>
          </Link>
        )}
      </Row>
    </Card>
  );
};

export default PanelApprovals;
