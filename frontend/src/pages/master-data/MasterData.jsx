import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Button, Col, Divider, Row, Table } from "antd";
import { DownCircleOutlined, LeftCircleOutlined } from "@ant-design/icons";
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
      render: (record) => record?.full_name || "",
    },
    {
      title: "Action",
      dataIndex: "id",
      width: "10%",
      render: (recordID) => {
        return (
          <Button
            shape="round"
            type="primary"
            onClick={() =>
              navigate(`/control-center/master-data/administration/${recordID}`)
            }
          >
            {text.editButton}
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

  const fetchData = useCallback(
    async (currentPage = 1, parent = null, search = null) => {
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
    },
    []
  );

  useEffect(() => {
    fetchAttributes();
  }, [fetchAttributes]);

  useEffect(() => {
    fetchData(currentPage, parent, search);
  }, [fetchData, currentPage, parent, search]);

  return (
    <div id="masterData">
      <div className="description-container">
        <Row justify="space-between" align="bottom">
          <Col>
            <Breadcrumbs pagePath={pagePath} />
            <DescriptionPanel
              description={text.admPanelText}
              title={text.manageAdministrativeList}
            />
          </Col>
        </Row>
      </div>
      <div className="table-section">
        <div className="table-wrapper">
          <AdministrationFilters
            loading={loading}
            onSearchChange={setSearch}
            maxLevel={4}
          />
          <Divider />
          <div
            style={{ padding: 0, minHeight: "40vh" }}
            bodystyle={{ padding: 0 }}
          >
            <Table
              columns={columns}
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
                    <DownCircleOutlined
                      onClick={(e) => onExpand(record, e)}
                      style={{ color: "#1651B6", fontSize: "19px" }}
                    />
                  ) : (
                    <LeftCircleOutlined
                      onClick={(e) => onExpand(record, e)}
                      style={{ color: "#1651B6", fontSize: "19px" }}
                    />
                  ),
              }}
              rowClassName="expandable-row editable-row"
              expandRowByClick
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default MasterData;
