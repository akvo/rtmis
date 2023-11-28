import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Card, Col, Divider, Modal, Row, Table } from "antd";
import {
  AdministrationFilters,
  Breadcrumbs,
  DescriptionPanel,
  ManageDataTab,
} from "../../components";
import { api, store, uiText } from "../../lib";
import { CloseSquareOutlined, PlusSquareOutlined } from "@ant-design/icons";
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

  const { language } = store.useState((s) => s);
  const { active: activeLang } = language;

  const text = useMemo(() => {
    return uiText[activeLang];
  }, [activeLang]);

  const columns = [
    {
      title: "Code",
      dataIndex: "code",
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
    Table.EXPAND_COLUMN,
  ];

  const handleChange = (e) => {
    setCurrentPage(e.current);
  };

  const deleteAdministration = async (row) => {
    setLoading(true);
    try {
      await api.delete(`/administrations/${row.id}`);
      const _dataset = dataset.filter((d) => d?.id !== row?.id);
      setDataset(_dataset);
      setLoading(false);
    } catch {
      setLoading(false);
    }
  };

  const handleOnDelete = (row) => {
    Modal.confirm({
      title: `Delete ${row.name}?`,
      onOk: () => {
        store.update((s) => {
          s.masterData.administration = {};
        });
        deleteAdministration(row);
      },
    });
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
              return (
                <DetailAdministration
                  {...{ record, attributes }}
                  onDelete={handleOnDelete}
                />
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

export default MasterData;
