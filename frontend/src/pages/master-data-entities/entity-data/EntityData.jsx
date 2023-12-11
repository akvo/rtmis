import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Button, Divider, Col, Row, Space, Table } from "antd";
import { Link } from "react-router-dom";

import {
  Breadcrumbs,
  DescriptionPanel,
  EntityDataFilters,
  ManageDataTab,
} from "../../../components";
import { api, store, uiText } from "../../../lib";

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

  const pagePath = [
    {
      title: text.controlCenter,
      link: "/control-center",
    },
    {
      title: text.manageEntities,
      link: "/master-data/entities/",
    },
    {
      title: text.entityDataTitle,
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
      title: text.entityText,
      dataIndex: "entity",
      render: (row) => row?.name || "",
    },
    {
      title: text.codeField,
      dataIndex: "code",
      width: "10%",
    },
    {
      title: text.nameField,
      dataIndex: "name",
    },
    {
      title: text.administrationField,
      dataIndex: "administration",
      render: (row) => row?.name || "",
    },
    {
      title: text.actionColumn,
      dataIndex: "id",
      key: "action",
      width: "10%",
      render: (row) => {
        return (
          <Space>
            <Link to={`/master-data/entities/data/${row}/edit`}>
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
      <div className="table-section">
        <div className="table-wrapper">
          <EntityDataFilters />
          <Divider />
          <div
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default EntityData;
