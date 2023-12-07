import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Card, Col, Divider, Row, Table } from "antd";
import {
  Breadcrumbs,
  DescriptionPanel,
  DetailTable,
  EntityFilters,
  ManageDataTab,
} from "../../components";
import { CloseSquareOutlined, PlusSquareOutlined } from "@ant-design/icons";

import { store, uiText } from "../../lib";
import fakeDataApi from "../../placeholders/master-data-entities.json";

const pagePath = [
  {
    title: "Control Center",
    link: "/control-center",
  },
  {
    title: "Manage Entities",
  },
];

const MasterDataEntities = () => {
  const [loading, setLoading] = useState(true);
  const [dataset, setDataset] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);

  const { language } = store.useState((s) => s);
  const { active: activeLang } = language;
  const newEntity = store.useState((s) => s.masterData.entity);

  const text = useMemo(() => {
    return uiText[activeLang];
  }, [activeLang]);

  const pagePath = [
    {
      title: "Control Center",
      link: "/control-center",
    },
    {
      title: text.manageEntities,
    },
  ];

  const columns = [
    {
      title: "Entity",
      dataIndex: "entity",
    },
    {
      title: "Name",
      dataIndex: "name",
    },
    {
      title: "Administration",
      dataIndex: "administration",
    },
    Table.EXPAND_COLUMN,
  ];

  const handleChange = (e) => {
    setCurrentPage(e.current);
  };

  const fetchData = useCallback(() => {
    // TODO
    setTimeout(() => {
      const { data: _dataset, total } = fakeDataApi;
      setDataset(_dataset);
      if (Object.keys(newEntity).length) {
        setDataset([
          {
            ...newEntity,
            entity: newEntity?.entity_id === 1 ? "School" : "Health Facility",
          },
          ..._dataset,
        ]);
      }
      setTotalCount(total);
      setLoading(false);
    }, 2000);
  }, [newEntity]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div id="users">
      <Row justify="space-between" align="bottom">
        <Col>
          <Breadcrumbs pagePath={pagePath} />
          <DescriptionPanel
            description={text.manageUserText}
            title="Manage Entities"
          />
        </Col>
      </Row>
      <ManageDataTab />
      <EntityFilters />
      <Divider />
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
          expandable={{
            expandedRowRender: (record) => {
              // TODO
              // initialValues only for dummy to replace static json
              const initialValues = record?.attributes?.length
                ? record.attributes.map((a) => ({
                    field: a.attribute,
                    value: a.value,
                  }))
                : [];
              return (
                <DetailTable record={record} initialValues={initialValues} />
              );
            },
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

export default MasterDataEntities;
