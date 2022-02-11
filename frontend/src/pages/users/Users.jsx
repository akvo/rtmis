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
import UserFilters from "../../components/filters/UserFilters";

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
  const [query, setQuery] = useState("");

  const { role, county, subCounty, ward, community } = store.useState(
    (state) => state.filters
  );

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
      filtered: true,
      filteredValue: query.trim() == "" ? [] : [query],
      onFilter: (value, filters) => {
        console.log(value, filters);
        return filters.email.toLowerCase().includes(value.toLowerCase());
      },
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
      filtered: true,
      filteredValue: community.id
        ? [community.id]
        : ward.id
        ? [ward.id]
        : subCounty.id
        ? [subCounty.id]
        : county.id
        ? [county.id]
        : [],
      onFilter: (value, filters) => filters.administration.id === value,
      filters: community.id
        ? community.options.map((option) => ({
            text: option.name,
            value: option.id,
          }))
        : ward.id
        ? ward.options.map((option) => ({
            text: option.name,
            value: option.id,
          }))
        : subCounty.id
        ? subCounty.options.map((option) => ({
            text: option.name,
            value: option.id,
          }))
        : county.options.map((option) => ({
            text: option.name,
            value: option.id,
          })),
      filterDropdownVisible: false,
      filterIcon: () => false,
    },
    Table.EXPAND_COLUMN,
  ];

  useEffect(() => {
    api
      .get("list/users/?page=1", {
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
      <UserFilters query={query} setQuery={setQuery} />
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
