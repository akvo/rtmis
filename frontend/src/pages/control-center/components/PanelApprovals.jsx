import React, { useState, useEffect, useMemo } from "react";
import { Table, Tabs, Row, Button } from "antd";
import { api, store, config, uiText } from "../../../lib";
import { Link } from "react-router-dom";
import { columnsApproval } from "../../approvals";
import "./style.scss";
import { DescriptionPanel } from "../../../components";

const PanelApprovals = () => {
  const [approvalsPending, setApprovalsPending] = useState([]);
  const [approvalTab, setApprovalTab] = useState("my-pending");
  const [loading, setLoading] = useState(true);
  const { user: authUser } = store.useState((s) => s);

  const { approvalsLiteral } = config;

  const { language } = store.useState((s) => s);
  const { active: activeLang } = language;

  const text = useMemo(() => {
    return uiText[activeLang];
  }, [activeLang]);

  const approvalsText = approvalsLiteral(authUser);

  const panelItems = useMemo(() => {
    const items = [
      {
        key: "my-pending",
        label: `${text.approvalsTab1} ${approvalsText}`,
      },
      {
        key: "subordinate",
        label: text.approvalsTab2,
      },
    ];
    if (authUser.role_detail.name === "Super Admin") {
      return items.filter((item) => item.key !== "subordinate");
    }
    return items;
  }, [authUser, text, approvalsText]);

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
    <div id="panel-approvals">
      <div className="row">
        <div className="flex-1">
          <h2>{approvalsText}</h2>
        </div>
        <div>
          <img src="/assets/approval.png" width={100} height={100} />
        </div>
      </div>
      <DescriptionPanel description={<div>{text.panelApprovalsDesc}</div>} />
      <Tabs
        defaultActiveKey={approvalTab}
        items={panelItems}
        onChange={setApprovalTab}
      />
      <Table
        dataSource={approvalsPending}
        loading={loading}
        columns={columnsApproval}
        pagination={{ position: ["none", "none"] }}
        scroll={{ y: 270 }}
      />
      <Row justify="space-between" className="approval-links">
        <Link to="/control-center/approvals">
          <Button type="primary" shape="round">
            View All
          </Button>
        </Link>
      </Row>
    </div>
  );
};

export default PanelApprovals;
