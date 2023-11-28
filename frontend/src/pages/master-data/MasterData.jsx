import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Button, Card, Col, Divider, Row, Table } from "antd";
import { CloseSquareOutlined, PlusSquareOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import {
  AdministrationFilters,
  Breadcrumbs,
  DescriptionPanel,
  ManageDataTab,
} from "../../components";
import { api, store, uiText } from "../../lib";
import DetailAdministration from "./DetailAdministration";

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
  const [attributes, setAttributes] = useState([]);
  const [dataset, setDataset] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const navigate = useNavigate();

  const { language } = store.useState((s) => s);
  const { active: activeLang } = language;

  const text = useMemo(() => {
    return uiText[activeLang];
  }, [activeLang]);

  const columns = [
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
      title: "Level",
      dataIndex: "level",
      render: (record) => record?.name || "",
    },
    {
      title: "Parent",
      dataIndex: "parent",
      render: (record) => record?.name || "",
    },
    {
      title: "Action",
      dataIndex: "id",
      width: "10%",
      render: (recordID) => {
        return (
          <Button
            type="link"
            onClick={() => navigate(`/master-data/${recordID}/edit`)}
          >
            Edit
          </Button>
        );
      },
    },
    Table.EXPAND_COLUMN,
  ];

  const handleChange = (e) => {
    setCurrentPage(e.current);
  };

  const fetchAttributes = useCallback(async () => {
    try {
      const { data: _attributes } = await api.get("/administration-attributes");
      setAttributes(_attributes);
      setLoading(false);
    } catch {
      setAttributes([]);
      setLoading(false);
    }
  }, []);

  const fetchData = useCallback(async () => {
    try {
      const { data: apiData } = await api.get(
        `/administrations?page=${currentPage}`
      );
      const { total, current, data } = apiData;
      // const _dataset = data.filter((d) => d?.level?.id !== 1);
      setDataset(data);
      setTotalCount(total);
      setCurrentPage(current);
      setLoading(false);
    } catch {
      setLoading(false);
    }
  }, [currentPage]);

  useEffect(() => {
    fetchAttributes();
  }, [fetchAttributes]);

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
            expandedRowRender: (record) => {
              return <DetailAdministration {...{ record, attributes }} />;
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

export default MasterData;
