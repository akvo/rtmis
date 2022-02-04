import React, { useEffect } from "react";
import "./style.scss";
import {
  Row,
  Col,
  Card,
  Button,
  Breadcrumb,
  Divider,
  Input,
  Select,
  Checkbox,
  Typography,
  Table,
} from "antd";
import { PlusSquareOutlined, CloseSquareOutlined } from "@ant-design/icons";
import { store } from "../../lib";
import { useNavigate } from "react-router-dom";

const { Option } = Select;
const { Title } = Typography;

const columns = [
  {
    title: "Name",
    dataIndex: "name",
    key: "name",
  },
  {
    title: "Organization",
    dataIndex: "organization",
    key: "organization",
  },
  {
    title: "Email",
    dataIndex: "email",
    key: "email",
  },
  {
    title: "Role",
    dataIndex: "role",
    key: "role",
  },
  {
    title: "Region",
    dataIndex: "region",
    key: "region",
  },
  Table.EXPAND_COLUMN,
];

const datasets = [
  {
    key: "1",
    name: "John Lilki",
    organization: "AKVO",
    email: "jhlilk22@yahoo.com",
    role: "Admin",
    region: "National",
  },
  {
    key: "2",
    name: "Jamie Harington",
    organization: "RSR",
    email: "jamieharington@yahoo.com",
    role: "Admin",
    region: "Baringo",
  },
  {
    key: "3",
    name: "John Doe",
    organization: "AKVO",
    email: "john.doe@yahoo.com",
    role: "User",
    region: "National",
  },
  {
    key: "4",
    name: "Jane Doe",
    organization: "MOH",
    email: "jdoe@yahoo.com",
    role: "User",
    region: "Nairobi",
  },
  {
    key: "5",
    name: "John Appleseed",
    organization: "MOH",
    email: "jappleseed@yahoo.com",
    role: "User",
    region: "Kisumu",
  },
];

const renderDetails = (record) => {
  return (
    <div>
      <div className="expand-wrap">
        <table>
          <thead>
            <tr>
              <th>Field</th>
              <th>Value</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Name</td>
              <td>
                <a href="#">{record.name}</a>
              </td>
            </tr>
            <tr>
              <td>Organization</td>
              <td>
                <a href="#">{record.organization}</a>
              </td>
            </tr>
            <tr>
              <td>Email</td>
              <td>
                <a href="#">{record.email}</a>
              </td>
            </tr>
            <tr>
              <td>Role</td>
              <td>
                <a href="#">{record.role}</a>
              </td>
            </tr>
            <tr>
              <td>Region</td>
              <td>
                <a href="#">{record.region}</a>
              </td>
            </tr>
            <tr>
              <td>Questionnaire</td>
              <td>
                <a href="#">{record.role}</a>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div className="expand-footer">
        <div>
          <Checkbox onChange={() => {}}>Inform User of Changes</Checkbox>
        </div>
        <div>
          <Button type="danger">Delete</Button>
        </div>
      </div>
    </div>
  );
};

const Users = () => {
  const { isLoggedIn } = store.useState();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoggedIn) {
      navigate("/login");
    }
  });

  return (
    <div id="users">
      <Row justify="space-between">
        <Col>
          <Breadcrumb
            separator={
              <h2 className="ant-typography" style={{ display: "inline" }}>
                {">"}
              </h2>
            }
          >
            <Breadcrumb.Item>
              <a href="">
                <Title style={{ display: "inline" }} level={2}>
                  Control Center
                </Title>
              </a>
            </Breadcrumb.Item>
            <Breadcrumb.Item>
              <a href="">
                <Title style={{ display: "inline" }} level={2}>
                  Manage Users
                </Title>
              </a>
            </Breadcrumb.Item>
          </Breadcrumb>
        </Col>
        <Col>
          <Button type="primary">Add new user</Button>
        </Col>
      </Row>
      <Divider />
      <Row>
        <Col span={4}>
          <Input placeholder="Search..." style={{ width: "90%" }} />
        </Col>
        <Col span={4}>
          <Select
            placeholder="Organization"
            style={{ width: "90%" }}
            onChange={() => {}}
          >
            <Option value="Organization 1">Organization 1</Option>
          </Select>
        </Col>
        <Col span={4}>
          <Select
            placeholder="Role"
            style={{ width: "90%" }}
            onChange={() => {}}
          >
            <Option value="Role 1">Role 1</Option>
          </Select>
        </Col>
        <Col span={4}>
          <Select
            placeholder="Region"
            style={{ width: "90%" }}
            onChange={() => {}}
          >
            <Option value="Region 1">Region 1</Option>
          </Select>
        </Col>
        <Col span={4}>&nbsp;</Col>
        <Col span={4} style={{ textAlign: "right" }}>
          <Checkbox onChange={() => {}}>Show Pending Users</Checkbox>
        </Col>
      </Row>
      <Divider />
      <Card style={{ padding: 0 }} bodyStyle={{ padding: 0 }}>
        <Table
          columns={columns}
          dataSource={datasets}
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
      </Card>
    </div>
  );
};

export default React.memo(Users);
