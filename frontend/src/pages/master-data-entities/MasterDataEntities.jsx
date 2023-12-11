import React, { useCallback, useEffect, useState, useMemo } from "react";
import { Button, Card, Col, Row, Space, Table } from "antd";
import { Breadcrumbs, ManageDataTab } from "../../components";

import { api, store, uiText } from "../../lib";
import { Link } from "react-router-dom";

const MasterDataEntities = () => {
  const [loading, setLoading] = useState(true);
  const [dataset, setDataset] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);

  const { language, user: authUser } = store.useState((s) => s);
  const { active: activeLang } = language;
  const text = useMemo(() => {
    return uiText[activeLang];
  }, [activeLang]);

  const pagePath = [
    {
      title: text.controlCenter,
      link: "/control-center",
    },
    {
      title: text.manageEntities,
    },
  ];

  const columns = [
    {
      title: "#",
      dataIndex: "id",
      key: "number",
      width: 100,
      render: (row, record, index) => (
        <div data-key={row} data-id={record?.id}>
          {index + 1}
        </div>
      ),
    },
    {
      title: text.nameField,
      dataIndex: "name",
      key: "name",
    },
    {
      title: text.actionColumn,
      dataIndex: "id",
      key: "action",
      width: "10%",
      render: (row) => {
        return (
          <Space>
            <Link to={`/master-data/entities/${row}/edit`}>
              <Button type="link">{text.editButton}</Button>
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
      const { data: apiData } = await api.get(`/entities?page=${currentPage}`);
      const { total, current, data: _dataset } = apiData;
      setDataset(_dataset);
      setTotalCount(total);
      setCurrentPage(current);
      setLoading(false);
    } catch (error) {
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
        </Col>
      </Row>
      <ManageDataTab />
      <Row>
        <Col span={16}></Col>
        <Col span={8}>
          {["Super Admin"].includes(authUser?.role?.value) && (
            <Link to="/master-data/entities/add">
              <Button type="primary">{text.addEntity}</Button>
            </Link>
          )}
        </Col>
      </Row>
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
          rowKey="id"
        />
      </Card>
    </div>
  );
};

export default MasterDataEntities;
