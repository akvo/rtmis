import React, { useEffect, useMemo, useState } from "react";
import "./style.scss";
import {
  Space,
  Card,
  Table,
  Tabs,
  Progress,
  Breadcrumb,
  Typography,
  Divider,
  Row,
  Button,
  Col,
  Checkbox,
  Spin,
  message,
} from "antd";
import { Link } from "react-router-dom";
import {
  FileTextFilled,
  InfoCircleOutlined,
} from "@ant-design/icons";
import { api } from "../../lib";

const { Title } = Typography;
const { TabPane } = Tabs;

const datasetApproved = [
  {
    key: "1",
    filename: "Single Form CSV",
    multiple: false,
    created_at: "2021-11-08 17:18",
    completion_status: 100,
    location: "Baringo",
    user: {
      id: 42,
      name: "Ouma Odhiambo",
    },
  },
  {
    key: "2",
    filename: "Bulk Upload CSV",
    multiple: true,
    created_at: "2021-11-08 17:18",
    completion_status: 85,
    location: "Busia",
    user: {
      id: 42,
      name: "John Doe",
    },
  },
  {
    key: "3",
    filename: "Single Form CSV",
    multiple: false,
    created_at: "2021-11-08 17:18",
    completion_status: 90,
    location: "Baringo",
    user: {
      id: 42,
      name: "Ouma Odhiambo",
    },
  },
  {
    key: "4",
    filename: "Bulk Upload CSV",
    multiple: true,
    created_at: "2021-11-08 17:18",
    completion_status: 100,
    location: "Baringo",
    user: {
      id: 42,
      name: "Ouma Odhiambo",
    },
  },
  {
    key: "5",
    filename: "Bulk Upload CSV",
    multiple: true,
    created_at: "2021-11-08 17:18",
    completion_status: 100,
    location: "Embu",
    user: {
      id: 42,
      name: "Ouma Odhiambo",
    },
  },
  {
    key: "6",
    filename: "Single Form CSV",
    multiple: false,
    created_at: "2021-11-08 17:18",
    completion_status: 85,
    location: "Lembus",
    user: {
      id: 42,
      name: "Ouma Odhiambo",
    },
  },
  {
    key: "7",
    filename: "Bulk Upload CSV",
    multiple: true,
    created_at: "2021-11-08 17:18",
    completion_status: 90,
    location: "Marigat",
    user: {
      id: 42,
      name: "Ouma Odhiambo",
    },
  },
  {
    key: "8",
    filename: "Bulk Upload CSV",
    multiple: true,
    created_at: "2021-11-08 17:18",
    completion_status: 100,
    location: "Baringo",
    user: {
      id: 42,
      name: "Ouma Odhiambo",
    },
  },
];

const datasetPending = [
  {
    key: "1",
    filename: "Single Form CSV",
    multiple: false,
    created_at: "2021-11-08 17:18",
    completion_status: 100,
    location: "Baringo",
  },
  {
    key: "2",
    filename: "Bulk Upload CSV",
    multiple: true,
    created_at: "2021-11-08 17:18",
    completion_status: 85,
    location: "Baringo",
  },
  {
    key: "3",
    filename: "Single Form CSV",
    multiple: false,
    created_at: "2021-11-08 17:18",
    completion_status: 90,
    location: "Baringo",
  },
  {
    key: "4",
    filename: "Bulk Upload CSV",
    multiple: true,
    created_at: "2021-11-08 17:18",
    completion_status: 100,
    location: "Baringo",
  },
  {
    key: "5",
    filename: "Bulk Upload CSV",
    multiple: true,
    created_at: "2021-11-08 17:18",
    completion_status: 100,
    location: "Baringo",
  },
  {
    key: "6",
    filename: "Single Form CSV",
    multiple: false,
    created_at: "2021-11-08 17:18",
    completion_status: 85,
    location: "Baringo",
  },
  {
    key: "7",
    filename: "Bulk Upload CSV",
    multiple: true,
    created_at: "2021-11-08 17:18",
    completion_status: 90,
    location: "Baringo",
  },
  {
    key: "8",
    filename: "Bulk Upload CSV",
    multiple: true,
    created_at: "2021-11-08 17:18",
    completion_status: 100,
    location: "Baringo",
  },
];

const Profile = () => {
  const [loading, setLoading] = useState(false);
  const [questionnairesloading, setQuestionnairesLoading] = useState(false);
  const [profileData, setProfileData] = useState(null);
  const [questionnaires, setQuestionnaires] = useState([]);
  const [selectedKeys, setSelectedKeys] = useState([]);

  const columnsApproved = [
    {
      title: "",
      dataIndex: "key",
      key: "key",
      render: () => <InfoCircleOutlined />,
      width: 50,
    },
    {
      title: "File",
      dataIndex: "filename",
      key: "filename",
      render: (filename, row) => (
        <Row align="middle">
          <Col>
            <FileTextFilled style={{ color: "#666666", fontSize: 28 }} />
          </Col>
          <Col>
            <div>{filename}</div>
            <div>{row.created_at}</div>
          </Col>
        </Row>
      ),
      sorter: (a, b) => a.filename.localeCompare(b.filename),
      sortDirections: ["ascend", "descend"],
    },
    {
      title: "Completion Status",
      dataIndex: "completion_status",
      key: "completion_status",
      render: (status) => (
        <Row>
          <Col xs={18}>
            <Progress
              percent={parseInt(status)}
              showInfo={false}
              strokeColor="#b5b5b5"
            />
          </Col>
          <Col align="right" xs={6}>
            {status}%
          </Col>
        </Row>
      ),
      sorter: (a, b) => a.completion_status - b.completion_status,
      sortDirections: ["ascend", "descend"],
    },
    {
      title: "Location",
      dataIndex: "location",
      key: "location",
      sorter: (a, b) => a.location.localeCompare(b.location),
      sortDirections: ["ascend", "descend"],
    },
    {
      title: "Approved By",
      dataIndex: "user",
      render: (user) => user.name || "",
      key: "user.id",
      sorter: (a, b) => a.user.name.localeCompare(b.user.name),
      sortDirections: ["ascend", "descend"],
    },
  ];

  const columnsPending = [
    {
      title: "",
      dataIndex: "key",
      key: "key",
      render: () => <InfoCircleOutlined />,
      width: 50,
    },
    {
      title: "File",
      dataIndex: "filename",
      key: "filename",
      render: (filename, row) => (
        <Row align="middle">
          <Col>
            <FileTextFilled style={{ color: "#666666", fontSize: 28 }} />
          </Col>
          <Col>
            <div>{filename}</div>
            <div>{row.created_at}</div>
          </Col>
        </Row>
      ),
      sorter: (a, b) => a.filename.localeCompare(b.filename),
      sortDirections: ["ascend", "descend"],
    },
    {
      title: "Completion Status",
      dataIndex: "completion_status",
      key: "completion_status",
      render: (status) => (
        <Row>
          <Col xs={18}>
            <Progress
              percent={parseInt(status)}
              showInfo={false}
              strokeColor="#b5b5b5"
            />
          </Col>
          <Col align="right" xs={6}>
            {status}%
          </Col>
        </Row>
      ),
      sorter: (a, b) => a.completion_status - b.completion_status,
      sortDirections: ["ascend", "descend"],
    },
    {
      title: "Location",
      dataIndex: "location",
      key: "location",
      sorter: (a, b) => a.location.localeCompare(b.location),
      sortDirections: ["ascend", "descend"],
    },
    {
      title: "Batch Datasets",
      dataIndex: "key",
      key: "key",
      render: (cell) => (
        <Checkbox
          onChange={() => {
            handleSelect(cell);
          }}
        />
      ),
    },
  ];

  const handleSelect = (key) => {
    const resultIndex = selectedKeys.findIndex((sk) => sk === key);
    if (resultIndex === -1) {
      setSelectedKeys([...selectedKeys, key]);
    } else {
      const clonedKeys = JSON.parse(JSON.stringify(selectedKeys));
      clonedKeys.splice(resultIndex, 1);
      setSelectedKeys(clonedKeys);
    }
  };

  const btnBatchSelected = useMemo(() => {
    if (selectedKeys.length > 0) {
      return <Button type="primary">Batch Selected Datasets</Button>;
    }
    return "";
  }, [selectedKeys]);

  const fetchProfile = () => {
    setLoading(true);
    api
      .get(`get/profile/`)
      .then((res) => {
        setProfileData(res.data);
        setLoading(false);
      })
      .catch(() => {
        message.error("Could not load profile");
        setLoading(false);
      });
  };

  const fetchQuestionnaires = () => {
    setQuestionnairesLoading(true);
    api
      .get(`forms/`)
      .then((res) => {
        setQuestionnaires(res.data);
        setQuestionnairesLoading(false);
      })
      .catch(() => {
        message.error("Could not load profile");
        setQuestionnairesLoading(false);
      });
  };

  useEffect(() => {
    fetchProfile();
    fetchQuestionnaires();
  }, []);

  return (
    <div id="profile">
      <Space>
        <Breadcrumb
          separator={
            <h2 className="ant-typography" style={{ display: "inline" }}>
              {">"}
            </h2>
          }
        >
          <Breadcrumb.Item>
            <Link to="/control-center">
              <Title style={{ display: "inline" }} level={2}>
                Control Center
              </Title>
            </Link>
          </Breadcrumb.Item>
          <Breadcrumb.Item>
            <Title style={{ display: "inline" }} level={2}>
              {profileData?.name || "Profile"}
            </Title>
          </Breadcrumb.Item>
        </Breadcrumb>
      </Space>
      <Divider />
      <Card style={{ padding: 0, marginBottom: 12 }}>
        <h1>My Profile</h1>
        {loading ? (
          <Spin />
        ) : (
          <ul>
            <li>
              <Space size="large" align="center">
                <span>{profileData?.name}</span>
                <span>·</span>
                <span>{profileData?.administration?.name}</span>
              </Space>
            </li>
            <li>
              <h3>Organization</h3>
              <p>Ministry of Health - Kisumu Subcounty</p>
            </li>
            <li>
              <h3>Questionnaires</h3>
              <Space size={[48, 18]} wrap>
                {questionnairesloading ? (
                  <Spin />
                ) : (
                  questionnaires.map((qi, qiI) => (
                    <span key={qiI}>{qi.name}</span>
                  ))
                )}
              </Space>
            </li>
          </ul>
        )}
      </Card>
      <Card
        style={{
          padding: 0,
          minHeight: "40vh",
        }}
      >
        <h1>Data Uploads</h1>
        <Tabs
          defaultActiveKey="1"
          onChange={() => {}}
          tabBarExtraContent={btnBatchSelected}
        >
          <TabPane tab="Approved Uploads" key="1">
            <Table
              dataSource={datasetApproved}
              columns={columnsApproved}
              pagination={{ position: ["none", "none"] }}
              scroll={{ y: 270 }}
              rowKey="key"
            />
          </TabPane>
          <TabPane tab="Pending Approval" key="2">
            <Table
              dataSource={datasetPending}
              columns={columnsPending}
              scroll={{ y: 270 }}
              rowKey="key"
            />
          </TabPane>
        </Tabs>
      </Card>
    </div>
  );
};

export default React.memo(Profile);
