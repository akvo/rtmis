import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Button, Card, Col, Divider, Row, Table, Typography } from "antd";
import {
  AdministrationFilters,
  Breadcrumbs,
  DescriptionPanel,
  ManageDataTab,
} from "../../components";

import { store, uiText } from "../../lib";
import fakeDataApi from "../../placeholders/master-data-attributes.json";
import { Link } from "react-router-dom";

const pagePath = [
  {
    title: "Control Center",
    link: "/control-center",
  },
  {
    title: "Manage Attributes",
  },
];

const { Text } = Typography;

const MasterDataAttributes = () => {
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
      title: "Attribute Type",
      dataIndex: "attribute_type",
    },
    {
      title: "Attribute",
      dataIndex: "name",
    },
    {
      title: "Value",
      dataIndex: "options",
      render: (options) => {
        return (
          <Text>
            {options.length
              ? options.map((o) => o?.name).join(" | ")
              : "Number"}
          </Text>
        );
      },
    },
    {
      title: "Action",
      dataIndex: "id",
      render: (dataID) => {
        return (
          <>
            <Button type="link" danger>
              Delete
            </Button>
            <Link to={`/master-data/attributes/${dataID}/edit`}>
              <Button type="link">Edit</Button>
            </Link>
          </>
        );
      },
    },
  ];

  const handleChange = (e) => {
    setCurrentPage(e.current);
  };

  const fetchData = useCallback(() => {
    setTimeout(() => {
      const { data: _dataset, total } = fakeDataApi;
      setDataset(_dataset);
      setTotalCount(total);
      setLoading(false);
    }, 2000);
  }, []);

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
      <AdministrationFilters />
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
        />
      </Card>
    </div>
  );
};

export default MasterDataAttributes;
