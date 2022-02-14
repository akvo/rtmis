import React, { useState, useEffect } from "react";
import "./style.scss";
import {
  Row,
  Col,
  Card,
  Button,
  Breadcrumb,
  Divider,
  Checkbox,
  Typography,
  Table,
  message,
} from "antd";
import { Link } from "react-router-dom";
import { PlusSquareOutlined, CloseSquareOutlined } from "@ant-design/icons";
import { api, store } from "../../lib";
import { useCookies } from "react-cookie";
import { UserFilters } from "../../components";

const { Title } = Typography;

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
                <a href="#">
                  {record.first_name} {record.last_name}
                </a>
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
            <tr>
              <td>Questionnaire</td>
              <td>
                <a href="#">-</a>
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
          <Link to={"/user/edit/" + record.id}>
            <Button type="secondary">Edit</Button>
          </Link>{" "}
          <Button danger>Delete</Button>
        </div>
      </div>
    </div>
  );
};

const Users = () => {
  const [cookies] = useCookies(["AUTH_TOKEN"]);
  const [loading, setLoading] = useState(true);
  const [dataset, setDataset] = useState([]);

  const { role } = store.useState((state) => state.filters);

  const { administration } = store.useState((state) => state);

  const selectedAdministration =
    administration.length > 0
      ? administration[administration.length - 1]
      : null;

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
      filtered: true,
      filteredValue: role ? [role] : [],
      filterDropdownVisible: false,
      filterIcon: () => false,
      filters: [
        { text: "Super Admin", value: "Super Admin" },
        { text: "Admin", value: "Admin" },
        { text: "Approver", value: "Approver" },
        { text: "User", value: "User" },
      ],
      onFilter: (value, filters) => filters.role.value === value,
    },
    {
      title: "Region",
      dataIndex: "administration",
      render: (administration) => administration?.name || "",
    },
    Table.EXPAND_COLUMN,
  ];

  useEffect(() => {
    if (cookies.AUTH_TOKEN && selectedAdministration) {
      api
        .get(`list/users/?page=1&administration=${selectedAdministration.id}`, {
          headers: { Authorization: `Bearer ${cookies.AUTH_TOKEN}` },
        })
        .then((res) => {
          setDataset(res.data.data);
          setLoading(false);
        })
        .catch((err) => {
          message.error("Could not load users");
          setLoading(false);
          console.error(err);
        });
    }
  }, [cookies.AUTH_TOKEN, selectedAdministration]);

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
              <Link to="/control-center">
                <Title style={{ display: "inline" }} level={2}>
                  Control Center
                </Title>
              </Link>
            </Breadcrumb.Item>
            <Breadcrumb.Item>
              <Title style={{ display: "inline" }} level={2}>
                Manage Users
              </Title>
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
      <UserFilters />
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
