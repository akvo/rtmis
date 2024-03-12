import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Button, Divider, Col, Row, Space, Table, Modal } from "antd";
import { Link, useNavigate } from "react-router-dom";

import {
  Breadcrumbs,
  DescriptionPanel,
  EntityDataFilters,
} from "../../../components";
import { api, store, uiText } from "../../../lib";

const EntityData = () => {
  const [loading, setLoading] = useState(true);
  const [dataset, setDataset] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState("");
  const [entityType, setEntityType] = useState();
  const { language, administration } = store.useState((s) => s);
  const { active: activeLang } = language;
  const administrationFilter = administration?.slice(-1)?.[0]?.id;
  const navigate = useNavigate();
  console.log("administrationFilter", administrationFilter);

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
    },
  ];

  const columns = [
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
      render: (row) => row?.full_name || "",
    },
    {
      title: text.entityType,
      dataIndex: "entity",
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
            <Link to={`/control-center/master-data/entities/${row}/edit`}>
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

  const handleOnDownload = async () => {
    try {
      const query = {};
      if (administrationFilter > 1) {
        query["adm_id"] = administrationFilter;
      }
      if (entityType) {
        query["entity_ids"] = entityType;
      }
      const params = new URLSearchParams(query);
      await api.get(`/export/entity-data?${params.toString()}`);
      navigate("/administration-download");
    } catch (err) {
      Modal.error({
        title: text.exportEntityError,
        content: String(err),
      });
    }
  };

  const fetchData = useCallback(async () => {
    try {
      let url = `/entity-data?page=${currentPage}`;
      if (administrationFilter && administrationFilter !== 1) {
        url = url + `&administration=${administrationFilter}`;
      }
      if (entityType) {
        url = url + `&entity=${entityType}`;
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
  }, [currentPage, administrationFilter, entityType, search]);

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
              description={text.manageEntitiesText}
              title={text.manageEntities}
            />
          </Col>
        </Row>
      </div>
      <div className="table-section">
        <div className="table-wrapper">
          <EntityDataFilters
            loading={loading}
            onSearchChange={setSearch}
            onEntityTypeChange={setEntityType}
            onDownload={handleOnDownload}
          />
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

export default EntityData;
