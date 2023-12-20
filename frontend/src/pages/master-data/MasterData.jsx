import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Button, Col, Divider, Row, Table } from "antd";
import { CloseSquareOutlined, PlusSquareOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import {
  AdministrationFilters,
  Breadcrumbs,
  DescriptionPanel,
} from "../../components";
import { api, store, uiText } from "../../lib";
import DetailAdministration from "./DetailAdministration";

const MasterData = () => {
  const [loading, setLoading] = useState(true);
  const [attributes, setAttributes] = useState([]);
  const [dataset, setDataset] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const { language, administration } = store.useState((s) => s);
  const { active: activeLang } = language;
  const parent = administration.slice(-1)?.[0]?.id;

  const text = useMemo(() => {
    return uiText[activeLang];
  }, [activeLang]);

  const pagePath = [
    {
      title: text.controlCenter,
      link: "/control-center",
    },
    {
      title: text.manageAdministrativeList,
    },
  ];

  const columns = [
    {
      title: text.codeLabel,
      dataIndex: "code",
      width: "10%",
    },
    {
      title: text.nameLabel,
      dataIndex: "name",
    },
    {
      title: text.levelLabel,
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
            onClick={() =>
              navigate(`/control-center/master-data/${recordID}/edit`)
            }
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
      let url = `/administrations?page=${currentPage}`;
      if (parent) {
        url = url + `&parent=${parent}`;
      }
      if (search) {
        url = url + `&search=${search}`;
      }
      const { data: apiData } = await api.get(url);
      const { total, current, data } = apiData;
      setDataset(data);
      setTotalCount(total);
      setCurrentPage(current);
      setLoading(false);
    } catch {
      setLoading(false);
    }
  }, [currentPage, parent, search]);

  useEffect(() => {
    fetchAttributes();
  }, [fetchAttributes]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div id="users">
      <div className="description-container">
        <Row justify="space-between" align="bottom">
          <Col>
            <Breadcrumbs pagePath={pagePath} />
            <DescriptionPanel
              description={text.manageUserText}
              title={text.manageAdministrativeList}
            />
          </Col>
        </Row>
      </div>
      <div className="table-section">
        <div className="table-wrapper">
          <AdministrationFilters loading={loading} onSearchChange={setSearch} />
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default MasterData;
