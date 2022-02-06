import React, { useEffect } from "react";
import "./style.scss";
import { Row, Col, Card, Button, Table, Tabs, Progress } from "antd";
import { Link } from "react-router-dom";
import { store, api } from "../../lib";
import {
  PlusSquareOutlined,
  CloseSquareOutlined,
  FileTextFilled,
  InfoCircleOutlined,
} from "@ant-design/icons";

const { TabPane } = Tabs;
const datasets = [
  {
    title: "Manage Data",
    buttonLabel: "Manage Data",
    description:
      "Open defecation free (ODF) is a term used to describe communities that have shifted to using toilets instead of open defecation. This can happen, for example, after community-led total sanitation programs have been implemented.",
    link: "/",
    image: require("../../assets/big-data.png"),
  },
  {
    title: "Exports",
    buttonLabel: "Data Exports",
    description:
      "Community-led total sanitation (CLTS) is an approach used mainly in developing countries to improve sanitation and hygiene practices in a community. The approach tries to achieve behavior change in mainly rural people by a process of “triggering”, leading to spontaneous and long-term abandonment of open defecation practices.",
    link: "/",
    image: require("../../assets/import.png"),
  },
  {
    title: "Data Uploads",
    buttonLabel: "Data Uploads",
    description:
      "WASH is an acronym that stands for “water, sanitation and hygiene”.Universal, affordable and sustainable access to WASH is a key public health issue within international development and is the focus of the first two targets of Sustainable Development Goal 6 (SDG 6).",
    link: "/",
    image: require("../../assets/upload.png"),
  },
  {
    title: "User Management",
    buttonLabel: "Manage User",
    description:
      "WASH is an acronym that stands for “water, sanitation and hygiene”.Universal, affordable and sustainable access to WASH is a key public health issue within international development and is the focus of the first two targets of Sustainable Development Goal 6 (SDG 6).",
    link: "/users",
    image: require("../../assets/personal-information.png"),
  },
];
const approvalsPending = [
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
];
const approvalsSubordinates = [];

const columns = [
  {
    title: "",
    dataIndex: "key",
    key: "key",
    render: () => <InfoCircleOutlined />,
  },
  {
    title: "File",
    dataIndex: "filename",
    key: "filename",
    render: (filename, row) => (
      <div className="row">
        <div>
          <FileTextFilled style={{ color: "#666666", fontSize: 28 }} />
        </div>
        <div>
          <div>{filename}</div>
          <div>{row.created_at}</div>
        </div>
      </div>
    ),
  },
  {
    title: "Completion Status",
    dataIndex: "completion_status",
    key: "completion_status",
    render: (status) => (
      <div className="row">
        <Progress
          percent={parseInt(status)}
          showInfo={false}
          strokeColor="#b5b5b5"
        />
        <div>{status}%</div>
      </div>
    ),
  },
  {
    title: "Location",
    dataIndex: "location",
    key: "location",
  },
  {
    title: "Uploaded By",
    dataIndex: "user",
    render: (user) => user.name || "",
    key: "user.id",
  },
  {
    title: "Waiting On",
    dataIndex: "waiting_on",
    render: (user) => user.name || "",
    key: "waiting_on.id",
  },
  Table.EXPAND_COLUMN,
];

const renderDetails = (record) => {
  return <div className="expand-body">Details View for {record.filename}</div>;
};

const ControlCenter = () => {
  const isLoggedIn = store.useState((state) => state.isLoggedIn);

  const init = () => {
    let url = `v1/forms/`;
    api
      .get(url)
      .then(() => {})
      .catch((err) => {
        console.error(err.response.data.message);
      });
  };

  useEffect(() => {
    if (isLoggedIn) {
      init(); // Test with an auth route
    }
  }, [isLoggedIn]);

  return (
    <div id="control-center">
      <h1>Control Center</h1>
      <Row gutter={16}>
        {datasets.map((dataset, index) => (
          <Col className="card-wrapper" span={12} key={index}>
            <Card bordered={false} hoverable>
              <div className="row">
                <div className="flex-1">
                  <h2>{dataset.title}</h2>
                  <p>{dataset.description}</p>
                  <Link to={dataset.link} className="explore">
                    <Button type="primary">{dataset.buttonLabel}</Button>
                  </Link>
                </div>
                <div>
                  <img src={dataset.image} width={100} height={100} />
                </div>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      <Card bordered={false} hoverable>
        <div className="row">
          <div className="flex-1">
            <h2>Approvals</h2>
            <p>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Etiam
              faucibus nisi at quam bibendum consequat. Maecenas tempor accumsan
              enim. Integer luctus, eros ut maximus gravida
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
              columns={columns}
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
            <Table dataSource={approvalsSubordinates} columns={columns} />
          </TabPane>
        </Tabs>
      </Card>
    </div>
  );
};

export default React.memo(ControlCenter);
