import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Button, Card, Col, Divider, Row, Table } from "antd";
import {
  AdministrationFilters,
  Breadcrumbs,
  DescriptionPanel,
  DetailTable,
  ManageDataTab,
} from "../../components";
import { store, uiText } from "../../lib";
import fakeDataApi from "../../placeholders/master-data-administrations";
import { CloseSquareOutlined, PlusSquareOutlined } from "@ant-design/icons";

const pagePath = [
  {
    title: "Control Center",
    link: "/control-center",
  },
  {
    title: "Manage Administrative List",
  },
];

const MasterData = () => {
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
      title: "Name",
      dataIndex: "name",
    },
    {
      title: "Level",
      dataIndex: "level_id",
    },
    {
      title: "Parent",
      dataIndex: "parent",
    },
    Table.EXPAND_COLUMN,
  ];

  const handleChange = (e) => {
    setCurrentPage(e.current);
  };

  const fetchData = useCallback(() => {
    setTimeout(() => {
      const { data: _dataset, total } = fakeDataApi;
      console.log("_dataset", _dataset, fakeDataApi);
      setDataset(_dataset);
      setTotalCount(total);
      setLoading(false);
    }, 2000);
  });

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
      <AdministrationFilters loading={loading} />
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
            expandedRowRender: (record) => <DetailTable record={record} />,
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

export default MasterData;
