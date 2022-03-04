import React, { useState, useEffect } from "react";
import "./style.scss";
import { Row, Col, Card, Button, Divider, Table } from "antd";
import { Link } from "react-router-dom";
import { PlusSquareOutlined, CloseSquareOutlined } from "@ant-design/icons";
import { api, store } from "../../lib";
import UserDetail from "./UserDetail";
import { UserFilters, Breadcrumbs } from "../../components";
import { useNotification } from "../../util/hooks";

const pagePath = [
  {
    title: "Control Center",
    link: "/control-center",
  },
  {
    title: "Manage Users",
  },
];

const Users = () => {
  const [loading, setLoading] = useState(true);
  const [dataset, setDataset] = useState([]);
  const [query, setQuery] = useState("");
  const [pending, setPending] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);

  const { administration, filters, isLoggedIn } = store.useState(
    (state) => state
  );
  const { role } = filters;
  const { notify } = useNotification();

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
    if (isLoggedIn) {
      let url = `users/?page=${currentPage}&pending=${
        pending ? "true" : "false"
      }`;
      if (selectedAdministration?.id) {
        url += `&administration=${selectedAdministration.id}`;
      }
      if (role) {
        url += `&role=${role}`;
      }
      setLoading(true);
      api
        .get(url)
        .then((res) => {
          setDataset(res.data.data);
          setTotalCount(res.data.total);
          setLoading(false);
        })
        .catch((err) => {
          notify({
            type: "error",
            message: "Could not load users",
          });
          setLoading(false);
          console.error(err);
        });
    }
  }, [role, pending, currentPage, selectedAdministration, isLoggedIn, notify]);

  return (
    <div id="users">
      <Row justify="space-between">
        <Col>
          <Breadcrumbs pagePath={pagePath} />
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
            showSizeChanger: false,
            current: currentPage,
            total: totalCount,
            pageSize: 10,
          }}
          rowKey="id"
          expandable={{
            expandedRowRender: UserDetail,
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
