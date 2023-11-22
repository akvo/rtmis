import React, { useMemo, useState, useEffect, useCallback } from "react";
import {
  Row,
  Col,
  Card,
  Button,
  Divider,
  Table,
  Space,
  Select,
  Input,
} from "antd";
import { Link } from "react-router-dom";
import { Breadcrumbs, DescriptionPanel } from "../../components";
import { store, uiText } from "../../lib";
// import { api, store, uiText, config } from "../../lib";
import { useNotification } from "../../util/hooks";
// import { orderBy } from "lodash";

const { Search } = Input;
const { Option } = Select;

const pagePath = [
  {
    title: "Control Center",
    link: "/control-center",
  },
  {
    title: "Mobile Data Collectors",
  },
];
const MobileDataCollector = () => {
  const { notify } = useNotification();

  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(null);
  const [dataset, setDataset] = useState([]);

  const { language, isLoggedIn } = store.useState((s) => s);
  const { active: activeLang } = language;

  const text = useMemo(() => {
    return uiText[activeLang];
  }, [activeLang]);

  const descriptionData = <div>{text.mobilePanelText}</div>;
  const columns = [
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
      width: 20,
      align: "center",
    },
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Village",
      dataIndex: "administration",
      key: "Administration",
    },
    {
      title: "Forms",
      dataIndex: "forms",
      key: "Forms",
    },
  ];

  const fetchData = useCallback(async () => {
    await new Promise((r) => setTimeout(r, 2000));
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div id="mobile-data-collectors">
      <Row justify="space-between" align="bottom">
        <Col>
          <Breadcrumbs pagePath={pagePath} />
          <DescriptionPanel description={descriptionData} />
        </Col>
        <Col>
          <Link to="/mobile/data-collectors/add">
            <Button type="primary">Add new data collector</Button>
          </Link>
        </Col>
      </Row>
      <Divider />

      {/* Filter */}
      <Row>
        <Col span={20}>
          <Space>
            <Search
              placeholder="Search..."
              onChange={(e) => {
                setSearch(e.target.value?.length >= 2 ? e.target.value : null);
              }}
              style={{ width: 225 }}
              allowClear
            />
          </Space>
        </Col>
      </Row>
      <Divider />

      {/* Table start here */}
      <Card
        style={{ padding: 0, minHeight: "40vh" }}
        bodyStyle={{ padding: 0 }}
      >
        <Table
          columns={columns}
          rowClassName={() => "editable-row"}
          dataSource={dataset}
          loading={loading}
          pagination={{
            showSizeChanger: false,
            showTotal: (total, range) =>
              `Results: ${range[0]} - ${range[1]} of ${total} items`,
          }}
          rowKey="id"
        />
      </Card>
    </div>
  );
};

export default MobileDataCollector;
