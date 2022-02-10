import React, { useEffect, useState } from "react";
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
  message,
} from "antd";
import { Link } from "react-router-dom";
import { PlusSquareOutlined, CloseSquareOutlined } from "@ant-design/icons";
import { api } from "../../lib";
import { useCookies } from "react-cookie";

const { Option } = Select;
const { Title } = Typography;

const columns = [
  {
    title: "Name",
    dataIndex: "first_name",
    key: "first_name",
    render: (firstName, row) => firstName + " " + row.last_name,
  },
  {
    title: "Organization",
    dataIndex: "administration",
    render: () => "-",
  },
  {
    title: "Email",
    dataIndex: "email",
  },
  {
    title: "Role",
    dataIndex: "role",
    render: (role) => role.value || "",
  },
  {
    title: "Region",
    dataIndex: "administration",
    render: (administration) => administration?.name || "",
  },
  Table.EXPAND_COLUMN,
];

// const dataset = [
//   {
//     key: "1",
//     name: "John Lilki",
//     organization: "AKVO",
//     email: "jhlilk22@yahoo.com",
//     role: "Admin",
//     region: "National",
//   },
//   {
//     key: "2",
//     name: "Jamie Harington",
//     organization: "RSR",
//     email: "jamieharington@yahoo.com",
//     role: "Admin",
//     region: "Baringo",
//   },
//   {
//     key: "3",
//     name: "John Doe",
//     organization: "AKVO",
//     email: "john.doe@yahoo.com",
//     role: "User",
//     region: "National",
//   },
//   {
//     key: "4",
//     name: "Jane Doe",
//     organization: "MOH",
//     email: "jdoe@yahoo.com",
//     role: "User",
//     region: "Nairobi",
//   },
//   {
//     key: "5",
//     name: "John Appleseed",
//     organization: "MOH",
//     email: "jappleseed@yahoo.com",
//     role: "User",
//     region: "Kisumu",
//   },
// ];

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
                <a href="#">{record.first_name + " " + record.last_name}</a>
              </td>
            </tr>
            <tr>
              <td>Organization</td>
              <td>
                <a href="#">-</a>
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
                <a href="#">{record.role?.value}</a>
              </td>
            </tr>
            <tr>
              <td>Region</td>
              <td>
                <a href="#">{record.administration?.name}</a>
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
  const [cookies] = useCookies(["AUTH_TOKEN"]);
  const [loading, setLoading] = useState(true);
  const [dataset, setDataset] = useState([]);

  useEffect(() => {
    api
      .get("list/users/?page=1", {
        headers: { Authorization: `Bearer ${cookies.AUTH_TOKEN}` },
      })
      .then((res) => {
        setDataset(res.data);
        setLoading(false);
      })
      .catch((err) => {
        message.error("Could not load users");
        setLoading(false);
        console.error(err);
      });
  }, [cookies.AUTH_TOKEN]);

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
          <Link to="/user/add">
            <Button type="primary">Add new user</Button>
          </Link>
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
          dataSource={dataset}
          loading={loading}
          rowKey="id"
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
