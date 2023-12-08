import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Button, Card, Col, Row, Space, Table } from "antd";
import { Link } from "react-router-dom";

import {
  Breadcrumbs,
  DescriptionPanel,
  EntityTab,
  ManageDataTab,
} from "../../../components";
import { api, store, uiText } from "../../../lib";

const pagePath = [
  {
    title: "Control Center",
    link: "/control-center",
  },
  {
    title: "Manage Entities",
    link: "/master-data/entities/",
  },
  {
    title: "Entity Data",
  },
];

const EntityData = () => {
  const [loading, setLoading] = useState(true);
  const [dataset, setDataset] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);

  const { language } = store.useState((s) => s);
  const { active: activeLang } = language;

  const text = useMemo(() => {
    return uiText[activeLang];
  }, [activeLang]);

  const columns = [
    {
      title: "#",
      dataIndex: "id",
      key: "number",
      render: (row, record, index) => (
        <div data-key={row} data-id={record?.id}>
          {index + 1}
        </div>
      ),
    },
    {
      title: "Entity",
      dataIndex: "entity",
      render: (row) => row?.name || "",
    },
    {
      title: "Code",
      dataIndex: "code",
      width: "10%",
    },
    {
      title: "Name",
      dataIndex: "name",
    },
    {
      title: "Administration",
      dataIndex: "administration",
      render: (row) => row?.name || "",
    },
    {
      title: "Action",
      dataIndex: "id",
      key: "action",
      width: "10%",
      render: (row) => {
        return (
          <Space>
            <Link to={`/master-data/entities/data/${row}/edit`}>
              <Button type="link">Edit</Button>
            </Link>
          </Space>
        );
      },
    },
  ];

  const handleChange = (e) => {
    setCurrentPage(e.current);
  };

  const fetchData = useCallback(async () => {
    try {
      const { data: apiData } = await api.get(
        `/entity-data?page=${currentPage}`
      );
      const { total, current, data: _dataset } = apiData;
      setDataset(_dataset);
      setTotalCount(total);
      setCurrentPage(current);
      setLoading(false);
    } catch {
      setLoading(false);
    }
  }, [currentPage]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div id="users">
      <Row justify="space-between" align="bottom">
        <Col>
          <Breadcrumbs pagePath={pagePath} />
          <DescriptionPanel description={text.manageUserText} />
        </Col>
      </Row>
      <ManageDataTab />
      <EntityTab
        tabBarExtraContent={
          <Link to="/master-data/entities/data/add">
            <Button type="primary">Add new data</Button>
          </Link>
        }
      />
      <Card
        style={{ padding: 0, minHeight: "40vh" }}
        bodyStyle={{ padding: 0 }}
      >
        <Table
          columns={columns}
          rowClassName={() => "editable-row"}
          dataSource={dataset}
          loading={loading}
          onChange={handleChange}
          pagination={{
            showSizeChanger: false,
            current: currentPage,
            total: totalCount,
            pageSize: 10,
            showTotal: (total, range) =>
              `Results: ${range[0]} - ${range[1]} of ${total} items`,
          }}
        />
      </Card>
    </div>
  );
};

export default EntityData;
