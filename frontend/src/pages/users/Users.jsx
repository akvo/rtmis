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
  const [query, setQuery] = useState("");
  const [pending, setPending] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);

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
      filtered: true,
      filteredValue: query.trim() === "" ? [] : [query],
      onFilter: (value, filters) =>
        filters.email.toLowerCase().includes(value.toLowerCase()),
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

  const handleChange = (e) => {
    setCurrentPage(e.current);
  };

  useEffect(() => {
    let url = `list/users/?page=${currentPage}&pending=${
      pending ? "true" : "false"
    }`;
    if(selectedAdministration?.id) {
      url += `&administration=${selectedAdministration.id}`;
    }
    api
      .get(url, {
        headers: { Authorization: `Bearer ${cookies.AUTH_TOKEN}` },
      })
      .then((res) => {
        setDataset(res.data.data);
        setTotalCount(res.data.total);
        setLoading(false);
      })
      .catch((err) => {
        message.error("Could not load users");
        setLoading(false);
        console.error(err);
      });
  }, [cookies.AUTH_TOKEN, pending, currentPage, selectedAdministration]);

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
      <UserFilters
        query={query}
        setQuery={setQuery}
        pending={pending}
        setPending={setPending}
        loading={loading}
      />
      <Divider />
      <Card
        style={{ padding: 0, minHeight: "40vh" }}
        bodyStyle={{ padding: 0 }}
      >
        <Table
          columns={columns}
          dataSource={dataset}
          loading={loading}
          onChange={handleChange}
          pagination={{
            total: totalCount,
            pageSize: 10,
          }}
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
