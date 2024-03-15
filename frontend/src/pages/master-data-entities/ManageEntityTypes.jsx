import React, { useCallback, useEffect, useState, useMemo } from "react";
import { Button, Divider, Col, Row, Space, Table } from "antd";
import { Breadcrumbs, DescriptionPanel, EntityFilters } from "../../components";

import { api, store, uiText } from "../../lib";
import { Link } from "react-router-dom";

const ManageEntityTypes = () => {
  const [loading, setLoading] = useState(true);
  const [dataset, setDataset] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState("");
  const language = store.useState((s) => s.language);
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
      title: text.manageEntityTypes,
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
            <Link to={`/control-center/master-data/entity-types/${row}/edit`}>
              <Button shape="round" type="primary">
                {text.editButton}
              </Button>
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
      let url = `/entities?page=${currentPage}`;
      if (search) {
        url = url + `&search=${search}`;
      }
      const { data: apiData } = await api.get(url);
      const { total, current, data: _dataset } = apiData;
      setDataset(_dataset);
      setTotalCount(total);
      setCurrentPage(current);
      setLoading(false);
    } catch (error) {
      setLoading(false);
    }
  }, [currentPage, search]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div id="masterDataEntities">
      <div className="description-container">
        <Row justify="space-between" align="bottom">
          <Col>
            <Breadcrumbs pagePath={pagePath} />
            <DescriptionPanel
              description={text.manageEntityTypesText}
              title={text.manageEntityTypes}
            />
          </Col>
        </Row>
      </div>
      <div className="table-section">
        <div className="table-wrapper">
          <EntityFilters onSearchChange={setSearch} />
          <Divider />
          <div
            style={{ padding: 0, minHeight: "40vh" }}
            bodystyle={{ padding: 0 }}
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManageEntityTypes;
