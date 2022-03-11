import React, { useState, useEffect } from "react";
import "./style.scss";
import { Row, Col, Card, Button, Table, Tabs } from "antd";
import { Link } from "react-router-dom";
import { api, store } from "../../lib";
import { columnsApproval } from "../approvals";

const { TabPane } = Tabs;
const panels = [
  {
    title: "Manage Data",
    buttonLabel: "Manage Data",
    description:
      "Open defecation free (ODF) is a term used to describe communities that have shifted to using toilets instead of open defecation. This can happen, for example, after community-led total sanitation programs have been implemented.",
    link: "/data/manage",
    image: require("../../assets/big-data.png"),
  },
  {
    title: "Exports",
    buttonLabel: "Data Exports",
    description:
      "Community-led total sanitation (CLTS) is an approach used mainly in developing countries to improve sanitation and hygiene practices in a community. The approach tries to achieve behavior change in mainly rural people by a process of “triggering”, leading to spontaneous and long-term abandonment of open defecation practices.",
    link: "/data/export",
    image: require("../../assets/import.png"),
    dev: true,
  },
  {
    title: "Data Uploads",
    buttonLabel: "Data Uploads",
    description:
      "WASH is an acronym that stands for “water, sanitation and hygiene”.Universal, affordable and sustainable access to WASH is a key public health issue within international development and is the focus of the first two targets of Sustainable Development Goal 6 (SDG 6).",
    link: "/data/upload",
    image: require("../../assets/upload.png"),
    dev: true,
  },
  {
    title: "User Management",
    buttonLabel: "Manage Users",
    description:
      "WASH is an acronym that stands for “water, sanitation and hygiene”.Universal, affordable and sustainable access to WASH is a key public health issue within international development and is the focus of the first two targets of Sustainable Development Goal 6 (SDG 6).",
    link: "/users",
    image: require("../../assets/personal-information.png"),
  },
];

const ControlCenter = () => {
  const [approvalsPending, setApprovalsPending] = useState([]);
  const [approvalTab, setApprovalTab] = useState("my-pending");
  const [loading, setLoading] = useState(true);
  const { user: authUser } = store.useState((s) => s);

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
    <div id="control-center">
      <h1>Control Center</h1>
      <Row gutter={[16, 16]}>
        {panels.map((panel, index) => (
          <Col className="card-wrapper" span={12} key={index}>
            <Card bordered={false} hoverable>
              <div className="row">
                <div className="flex-1">
                  <h2>{panel.title}</h2>
                  <p>{panel.description}</p>
                  <Link to={panel.link} className="explore">
                    <Button
                      type={panel.dev ? "default" : "primary"}
                      className={panel?.dev ? "dev" : ""}
                    >
                      {panel.buttonLabel}
                    </Button>
                  </Link>
                </div>
                <div>
                  <img src={panel.image} width={100} height={100} />
                </div>
              </div>
            </Card>
          </Col>
        ))}

        <Col span={24}>
          <Card bordered={false}>
            <div className="row">
              <div className="flex-1">
                <h2>Approvals</h2>
                <p>
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit. Etiam
                  faucibus nisi at quam bibendum consequat. Maecenas tempor
                  accumsan enim. Integer luctus, eros ut maximus gravida
                </p>
              </div>
              <div>
                <img
                  src={require("../../assets/approval.png")}
                  width={100}
                  height={100}
                />
              </div>
            </div>
            <Tabs defaultActiveKey={approvalTab} onChange={setApprovalTab}>
              <TabPane tab="My Pending Approvals" key="my-pending"></TabPane>
              <TabPane tab="Subordinates Approvals" key="subordinate"></TabPane>
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
              {["Super Admin", "Admin"].includes(authUser?.role?.value) && (
                <Link to="/approvers/tree">
                  <Button type="primary">Manage Approvers</Button>
                </Link>
              )}
            </Row>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default React.memo(ControlCenter);
