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
  Modal,
  message,
  Select,
} from "antd";
import { Link } from "react-router-dom";
import { FileTextFilled, InfoCircleOutlined } from "@ant-design/icons";
import { useCookies } from "react-cookie";
import { api } from "../../lib";

const { Title } = Typography;
const { TabPane } = Tabs;
const { Option } = Select;

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
  const [selectedRows, setSelectedRows] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [cookies] = useCookies(["AUTH_TOKEN"]);

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
      render: (row) => (
        <Checkbox
          onChange={() => {
            handleSelect(row);
          }}
        />
      ),
    },
  ];

  const columnsSelected = [
    {
      title: "Dataset",
      dataIndex: "filename",
      key: "filename",
    },
    {
      title: "Date Uploaded",
      dataIndex: "created_at",
      key: "created_at",
    },
    {
      title: "",
      render: () => <Checkbox />,
    },
  ];

  const pagePath = [
    {
      title: "Control Center",
      link: "/control-center",
    },
    {
      title: profileData?.name || "Profile",
    },
  ];

  const handleSelect = (row) => {
    const resultIndex = selectedRows.findIndex((sR) => sR.key === row.key);
    if (resultIndex === -1) {
      setSelectedRows([...selectedRows, row]);
    } else {
      const clonedRows = JSON.parse(JSON.stringify(selectedRows));
      clonedRows.splice(resultIndex, 1);
      setSelectedRows(clonedRows);
    }
  };

  const btnBatchSelected = useMemo(() => {
    if (selectedRows.length > 0) {
      return (
        <Button
          type="primary"
          onClick={() => {
            setModalVisible(true);
          }}
        >
          Batch Selected Datasets
        </Button>
      );
    }
    return "";
  }, [selectedRows]);

  useEffect(() => {
    const fetchProfile = () => {
      setLoading(true);
      api
        .get(`get/profile/`, {
          headers: { Authorization: `Bearer ${cookies.AUTH_TOKEN}` },
        })
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
    fetchProfile();
    fetchQuestionnaires();
  }, [cookies.AUTH_TOKEN]);

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
              pagination={false}
              scroll={{ y: 270 }}
              rowKey="key"
            />
          </TabPane>
          <TabPane tab="Pending Approval" key="2">
            <Table
              dataSource={datasetPending}
              columns={columnsPending}
              pagination={false}
              scroll={{ y: 270 }}
              rowKey="key"
            />
          </TabPane>
        </Tabs>
      </Card>
      <Modal
        visible={modalVisible}
        onCancel={() => {
          setModalVisible(false);
        }}
        footer={
          <Row>
            <Col xs={12} align="left">
              <Checkbox>Send a new approval request</Checkbox>
            </Col>
            <Col xs={12}>
              <Button
                className="light"
                onClick={() => {
                  setModalVisible(false);
                }}
              >
                Cancel
              </Button>
              <Button type="primary">Create a new batch</Button>
            </Col>
          </Row>
        }
      >
        <p>You are about to create a Batch CSV File</p>
        <p>
          <FileTextFilled style={{ color: "#666666", fontSize: 64 }} />
        </p>
        <p>
          The operation of merging datasets cannot be undone, and will Create a
          new batch that will require approval from you admin
        </p>
        <Card style={{ padding: 0 }} bodyStyle={{ padding: 0 }}>
          <Table
            dataSource={selectedRows}
            columns={columnsSelected}
            pagination={false}
            scroll={{ y: 270 }}
            rowKey="key"
          />
          <div>
            <label>Approver</label>
          </div>
          <Select defaultValue="admin" style={{ width: 120 }}>
            <Option value="admin">Auma Awiti</Option>
          </Select>
        </Card>
      </Modal>
    </div>
  );
};

export default React.memo(Profile);
