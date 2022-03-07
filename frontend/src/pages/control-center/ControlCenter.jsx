import React, { useState, useEffect } from "react";
import "./style.scss";
import { Row, Col, Card, Button, Table, Tabs, Progress } from "antd";
import { Link } from "react-router-dom";
import {
  PlusSquareOutlined,
  CloseSquareOutlined,
  FileTextFilled,
  InfoCircleOutlined,
} from "@ant-design/icons";
import { api, store } from "../../lib";

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
const pprovalsPending = [
  {
    key: "1",
    filename: "Lorem Ipsum CSV File 1",
    created_at: "2021-11-08 17:18",
    completion_status: 100,
    location: "Baringo",
    user: {
      id: 42,
      name: "Ouma Odhiambo",
    },
    waiting_on: {
      id: 21,
      name: "K. Choge",
    },
  },
  {
    key: "2",
    filename: "Lorem Ipsum CSV File 2",
    created_at: "2021-11-08 17:18",
    completion_status: 85,
    location: "Baringo",
    user: {
      id: 42,
      name: "Ouma Odhiambo",
    },
    waiting_on: {
      id: 22,
      name: "A. Awiti",
    },
  },
  {
    key: "3",
    filename: "Lorem Ipsum CSV File 3",
    created_at: "2021-11-08 17:18",
    completion_status: 90,
    location: "Baringo",
    user: {
      id: 42,
      name: "Ouma Odhiambo",
    },
    waiting_on: {
      id: 23,
      name: "Ruto Cindy",
    },
  },
  {
    key: "4",
    filename: "Lorem Ipsum CSV File 4",
    created_at: "2021-11-08 17:18",
    completion_status: 100,
    location: "Baringo",
    user: {
      id: 42,
      name: "Ouma Odhiambo",
    },
    waiting_on: {
      id: 24,
      name: "John Doe",
    },
  },
  {
    key: "5",
    filename: "Lorem Ipsum CSV File 1",
    created_at: "2021-11-08 17:18",
    completion_status: 100,
    location: "Baringo",
    user: {
      id: 42,
      name: "Ouma Odhiambo",
    },
    waiting_on: {
      id: 21,
      name: "K. Choge",
    },
  },
  {
    key: "6",
    filename: "Lorem Ipsum CSV File 2",
    created_at: "2021-11-08 17:18",
    completion_status: 85,
    location: "Baringo",
    user: {
      id: 42,
      name: "Ouma Odhiambo",
    },
    waiting_on: {
      id: 22,
      name: "A. Awiti",
    },
  },
  {
    key: "7",
    filename: "Lorem Ipsum CSV File 3",
    created_at: "2021-11-08 17:18",
    completion_status: 90,
    location: "Baringo",
    user: {
      id: 42,
      name: "Ouma Odhiambo",
    },
    waiting_on: {
      id: 23,
      name: "Ruto Cindy",
    },
  },
  {
    key: "8",
    filename: "Lorem Ipsum CSV File 4",
    created_at: "2021-11-08 17:18",
    completion_status: 100,
    location: "Baringo",
    user: {
      id: 42,
      name: "Ouma Odhiambo",
    },
    waiting_on: {
      id: 24,
      name: "John Doe",
    },
  },
];
const approvalsSubordinates = [];

const columns = [
  {
    title: "",
    dataIndex: "key",
    key: "key",
    width: "40px",
    render: () => <InfoCircleOutlined />,
  },
  {
    title: "Submission",
    dataIndex: "name",
    key: "name",
    width: "25%",
    render: (filename, row) => (
      <div className="row">
        <div>
          <FileTextFilled style={{ color: "#666666", fontSize: 28 }} />
        </div>
        <div>
          <div>{filename}</div>
        </div>
      </div>
    ),
  },
  {
    title: "Form",
    dataIndex: "form",
    key: "form",
    render: (form) => form.name,
  },
  {
    title: "Date",
    dataIndex: "created",
    key: "created",
  },
  {
    title: "Submitter",
    dataIndex: "created_by",
    key: "created_by",
  },
  {
    title: "Location",
    dataIndex: "administration",
    key: "administration",
    render: (administration) => administration.name,
  },
  {
    title: "Status",
    dataIndex: "approver",
    key: "approver",
    render: (approver) => approver.status_text,
  },
  {
    title: "Waiting on",
    dataIndex: "approver",
    key: "waiting_on",
    render: (approver) => approver.name,
  },
  Table.EXPAND_COLUMN,
];

const renderDetails = (record) => {
  return <div className="expand-body">Details View for {record.filename}</div>;
};

const ControlCenter = () => {
  const [approvalsPending, setApprovalsPending] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api
      .get(`/form-pending-batch/?page=1`)
      .then((res) => {
        setApprovalsPending(res.data.batch);
        setLoading(false);
      })
      .catch((e) => {
        console.error(e);
        setLoading(false);
      });
  }, []);

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
            <Tabs defaultActiveKey="1" onChange={() => {}}>
              <TabPane tab="My Pending Approvals" key="1">
                <Table
                  dataSource={approvalsPending}
                  loading={loading}
                  columns={columns}
                  pagination={{ position: ["none", "none"] }}
                  scroll={{ y: 270 }}
                  expandable={{
                    expandedRowRender: renderDetails,
                    expandIcon: ({ expanded, onExpand, record }) =>
                      expanded ? (
                        <CloseSquareOutlined
                          onClick={(e) => onExpand(record, e)}
                          style={{ color: "#e94b4c" }}
                        />
                      ) : (
                        <PlusSquareOutlined
                          onClick={(e) => onExpand(record, e)}
                          style={{ color: "#7d7d7d" }}
                        />
                      ),
                  }}
                />
              </TabPane>
              <TabPane tab="Subordinates Approvals" key="2">
                <Table
                  className="dev"
                  dataSource={approvalsSubordinates}
                  columns={columns}
                />
              </TabPane>
            </Tabs>
            <Row justify="space-between" className="approval-links">
              <Link to="/approvals">
                <Button type="primary">View All</Button>
              </Link>
              <Link to="/approvers/tree">
                <Button className="dev">Manage Approvers</Button>
              </Link>
            </Row>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default React.memo(ControlCenter);
