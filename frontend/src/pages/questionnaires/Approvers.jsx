import React, { useState, useEffect, useMemo } from "react";
import "./style.scss";
import {
  Row,
  Col,
  Card,
  Divider,
  Table,
  ConfigProvider,
  Empty,
  Select,
} from "antd";
import { Breadcrumbs } from "../../components";
import { api, store } from "../../lib";
import ApproverFilters from "../../components/filters/ApproverFilters";

const { Option } = Select;
const pagePath = [
  {
    title: "Control Center",
    link: "/control-center",
  },
  {
    title: "Manage Approvers",
  },
];

const users = [
  {
    id: 1,
    name: "A. Awiti",
  },
  {
    id: 2,
    name: "Kerubo Stacy",
  },
  {
    id: 3,
    name: "Kimeli. K",
  },
  {
    id: 4,
    name: "Kipsang Kipchoge",
  },
  {
    id: 5,
    name: "Maina Mwangi",
  },
];

const Approvers = () => {
  const [loading, setLoading] = useState(false);
  const [dataset, setDataset] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);

  const { administration, selectedForm } = store.useState((state) => state);

  const selectedAdministration =
    administration.length > 0
      ? administration[administration.length - 1]
      : null;

  const userMenu = useMemo(() => {
    return (
      <Select value={1} showArrow={false}>
        {users.map((user, userIndex) => (
          <Option key={userIndex} value={user.id}>
            {user.name}
          </Option>
        ))}
      </Select>
    );
  }, []);

  const columns = [
    {
      title: "Questionnaire",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Ward 1",
      render: () => userMenu,
    },
    {
      title: "Ward 2",
      render: () => userMenu,
    },
    {
      title: "Ward 3",
      render: () => userMenu,
    },
    {
      title: "Ward 4",
      render: () => userMenu,
    },
    {
      title: "Ward 5",
      render: () => userMenu,
    },
  ];

  const handleChange = (e) => {
    setCurrentPage(e.current);
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedAdministration]);

  useEffect(() => {
    if (selectedForm) {
      setLoading(true);
      let url = `list/form-data/${selectedForm}/?page=${currentPage}`;
      if (selectedAdministration?.id) {
        url += `&administration=${selectedAdministration.id}`;
      }
      api
        .get(url)
        .then((res) => {
          setDataset(res.data.data);
          setTotalCount(res.data.total);
          setLoading(false);
        })
        .catch(() => {
          setDataset([]);
          setTotalCount(0);
          setLoading(false);
        });
    }
  }, [selectedForm, selectedAdministration, currentPage]);

  return (
    <div id="approvers">
      <Row justify="space-between">
        <Col>
          <Breadcrumbs pagePath={pagePath} />
        </Col>
      </Row>
      <Divider />
      <ApproverFilters loading={loading} />
      <Divider />
      <Card
        style={{ padding: 0, minHeight: "40vh" }}
        bodyStyle={{ padding: 30 }}
      >
        <ConfigProvider renderEmpty={() => <Empty description="No data" />}>
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
          />
        </ConfigProvider>
      </Card>
    </div>
  );
};

export default React.memo(Approvers);
