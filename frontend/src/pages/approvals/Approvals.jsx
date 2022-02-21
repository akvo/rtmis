import React, { useEffect, useState } from "react";
import "./style.scss";
import {
  Row,
  Col,
  Card,
  Divider,
  Table,
  Tabs,
  Progress,
  Input,
  Checkbox,
  Button,
} from "antd";
import { Breadcrumbs } from "../../components";
import { Link } from "react-router-dom";
import {
  PlusSquareOutlined,
  CloseSquareOutlined,
  FileTextFilled,
  InfoCircleOutlined,
} from "@ant-design/icons";
import { store } from "../../lib";

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
const { TextArea } = Input;

const approvalsPending = [
  {
    key: "1",
    filename: "Lorem Ipsum CSV File 1",
    created_at: "2021-11-08 17:18",
    completion_status: 100,
    location: "Baringo",
    questionnaire: "G1-1 Households V1",
    user: {
      id: 42,
      name: "Ouma Odhiambo",
    },
    approved_by: {
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
    questionnaire: "G1-2 Households V1",
    user: {
      id: 42,
      name: "Ouma Odhiambo",
    },
    approved_by: {
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
    questionnaire: "G1-3 Households V1",
    user: {
      id: 42,
      name: "Ouma Odhiambo",
    },
    approved_by: {
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
    questionnaire: "G1-4 Households V1",
    user: {
      id: 42,
      name: "Ouma Odhiambo",
    },
    approved_by: {
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
    questionnaire: "G1-5 Households V1",
    user: {
      id: 42,
      name: "Ouma Odhiambo",
    },
    approved_by: {
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
    questionnaire: "G1-6 Households V1",
    user: {
      id: 42,
      name: "Ouma Odhiambo",
    },
    approved_by: {
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
    questionnaire: "G1-7 Households V1",
    user: {
      id: 42,
      name: "Ouma Odhiambo",
    },
    approved_by: {
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
    questionnaire: "G1-8 Households V1",
    user: {
      id: 42,
      name: "Ouma Odhiambo",
    },
    approved_by: {
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
    width: 40,
  },
  {
    title: "File",
    dataIndex: "filename",
    key: "filename",
    render: (filename, row) => (
      <Row>
        <Col>
          <FileTextFilled style={{ fontSize: 28 }} />
        </Col>
        <Col>
          <div>{filename}</div>
          <div>{row.created_at}</div>
        </Col>
      </Row>
    ),
  },
  {
    title: "Completion Status",
    dataIndex: "completion_status",
    key: "completion_status",
    render: (status) => (
      <Row>
        <Col xs={16}>
          <Progress percent={parseInt(status)} showInfo={false} />
        </Col>
        <Col>{status}%</Col>
      </Row>
    ),
  },
  {
    title: "Questionnaire",
    dataIndex: "questionnaire",
    key: "questionnaire",
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
    title: "Approved By",
    dataIndex: "approved_by",
    render: (user) => user.name || "",
    key: "approved_by.id",
  },
  Table.EXPAND_COLUMN,
];

const datasetRawdata = [
  {
    key: 1,
    county: "Kisumu",
    subcounty: "Nyando",
    ward: "Lolwe",
    sublocation: "Lolwe - North",
    community: "Kenya Re",
    date: "27-10-2021",
    monitor: "Ouma Odhiambo",
    q1: "6/4",
  },
  {
    key: 2,
    county: "Kisumu",
    subcounty: "Nyando",
    ward: "Kolwa",
    sublocation: "Kolwa - East",
    community: "Nyamware",
    date: "27-10-2021",
    monitor: "Ouma Odhiambo",
    q1: "7/3",
  },
  {
    key: 3,
    county: "Kisumu",
    subcounty: "Nyando",
    ward: "Lolwe",
    sublocation: "Lolwe - North",
    community: "Kenya Re",
    date: "27-10-2021",
    monitor: "Ouma Odhiambo",
    q1: "6/4",
  },
  {
    key: 4,
    county: "Kisumu",
    subcounty: "Nyando",
    ward: "Kolwa",
    sublocation: "Kolwa - East",
    community: "Nyamware",
    date: "27-10-2021",
    monitor: "Ouma Odhiambo",
    q1: "7/3",
  },
  {
    key: 5,
    county: "Kisumu",
    subcounty: "Nyando",
    ward: "Lolwe",
    sublocation: "Lolwe - North",
    community: "Kenya Re",
    date: "27-10-2021",
    monitor: "Ouma Odhiambo",
    q1: "6/4",
  },
  {
    key: 6,
    county: "Kisumu",
    subcounty: "Nyando",
    ward: "Kolwa",
    sublocation: "Kolwa - East",
    community: "Nyamware",
    date: "27-10-2021",
    monitor: "Ouma Odhiambo",
    q1: "7/3",
  },
  {
    key: 7,
    county: "Kisumu",
    subcounty: "Nyando",
    ward: "Lolwe",
    sublocation: "Lolwe - North",
    community: "Kenya Re",
    date: "27-10-2021",
    monitor: "Ouma Odhiambo",
    q1: "6/4",
  },
  {
    key: 8,
    county: "Kisumu",
    subcounty: "Nyando",
    ward: "Kolwa",
    sublocation: "Kolwa - East",
    community: "Nyamware",
    date: "27-10-2021",
    monitor: "Ouma Odhiambo",
    q1: "7/3",
  },
];

const columnsRawData = [
  {
    title: "",
    dataIndex: "key",
    key: "key",
    // width: 40,
  },
  {
    title: "County",
    dataIndex: "county",
    key: "county",
  },
  {
    title: "Sub-county",
    dataIndex: "subcounty",
    key: "subcounty",
  },
  {
    title: "Ward",
    dataIndex: "ward",
    key: "ward",
  },
  {
    title: "Sub-Location",
    dataIndex: "sublocation",
    key: "sublocation",
  },
  {
    title: "Community",
    dataIndex: "community",
    key: "community",
  },
  {
    title: "Date",
    dataIndex: "date",
    key: "date",
  },
  {
    title: "Monitor",
    dataIndex: "monitor",
    key: "monitor",
  },
  {
    title: "No exposed Human excreta",
    dataIndex: "q1",
    key: "q1",
  },
];

const renderDetails = () => {
  return (
    <div>
      <Tabs centered defaultActiveKey="1" onChange={() => {}}>
        <TabPane tab="Data Summary" key="1">
          <div>
            <table>
              <thead>
                <tr>
                  <th>Field</th>
                  <th>Value</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>County</td>
                  <td>20</td>
                </tr>
                <tr>
                  <td>Sub-county</td>
                  <td>64</td>
                </tr>
                <tr>
                  <td>Ward</td>
                  <td>300</td>
                </tr>
                <tr>
                  <td>Sub-Location</td>
                  <td>570</td>
                </tr>
                <tr>
                  <td>Community</td>
                  <td>2000</td>
                </tr>
                <tr>
                  <td>Date</td>
                  <td>12-02-2021</td>
                </tr>
                <tr>
                  <td>Monitor Name</td>
                  <td>Odhiambo Ouma</td>
                </tr>
                <tr>
                  <td>No exposed human excreta (G1-1)</td>
                  <td>7/3</td>
                </tr>
                <tr>
                  <td>Safe disposal of child excreta and diapers (G1-2)</td>
                  <td>20</td>
                </tr>
                <tr>
                  <td>
                    Presence of handwashing facility with water {"&"}
                    soap (G1-4)
                  </td>
                  <td>6/4</td>
                </tr>
                <tr>
                  <td>Handwashing facility with soap (G2-4)</td>
                  <td>6/4</td>
                </tr>
                <tr>
                  <td>Permanent Hand washing facility (G3-4)</td>
                  <td>6/2/2</td>
                </tr>
              </tbody>
            </table>
          </div>
        </TabPane>
        <TabPane tab="Raw Data" key="2">
          <Table
            dataSource={datasetRawdata}
            columns={columnsRawData}
            scroll={{ x: "max-content" }}
            pagination={false}
          />
        </TabPane>
      </Tabs>
      <label>Notes {"&"} Feedback</label>
      <TextArea rows={4} />
      <Row justify="space-between">
        <Col>
          <Row>
            <Checkbox id="informUser" onChange={() => {}}></Checkbox>
            <label htmlFor="informUser">Inform User of Changes</label>
          </Row>
        </Col>
        <Col>
          <Button className="light">Decline</Button>
          <Button type="primary" htmlType="submit">
            Approve
          </Button>
        </Col>
      </Row>
    </div>
  );
};

const Approvals = () => {
  const [expandedKeys, setExpandedKeys] = useState([]);
  const [role, setRole] = useState(null);

  const { user } = store.useState((state) => state);

  useEffect(() => {
    setRole(user?.role?.id);
  }, [user]);

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
              columns={columns}
              pagination={{ position: ["none", "none"] }}
              expandable={{
                expandedRowRender: renderDetails,
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
            <Table dataSource={approvalsSubordinates} columns={columns} />
          </TabPane>
        </Tabs>
      </Card>
    </div>
  );
};

export default React.memo(Approvals);
