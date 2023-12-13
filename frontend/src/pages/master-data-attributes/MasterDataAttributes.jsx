import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Button, Col, Divider, Row, Table, Typography } from "antd";
import {
  AttributeFilters,
  Breadcrumbs,
  DescriptionPanel,
  ManageDataTab,
} from "../../components";

import { api, store, uiText } from "../../lib";
import { useNavigate } from "react-router-dom";

const { Text } = Typography;

const MasterDataAttributes = () => {
  const [loading, setLoading] = useState(true);
  const [dataset, setDataset] = useState([]);
  const navigate = useNavigate();

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
      title: text.manageAttributes,
    },
  ];

  const handleOnEdit = (record) => {
    store.update((s) => {
      s.masterData.attribute = {
        ...record,
        options: record?.options?.map((opt) => ({ name: opt })),
      };
    });
    navigate(`/master-data/attributes/${record.id}/edit`);
  };

  const columns = [
    {
      title: "Attribute For",
      dataIndex: "attribute_for",
    },
    {
      title: "Attribute",
      dataIndex: "name",
    },
    {
      title: "Type",
      dataIndex: "type",
    },
    {
      title: "Value",
      dataIndex: "options",
      render: (options) => {
        return (
          <Text>
            {options.length ? options.map((o) => o).join(" | ") : "Number"}
          </Text>
        );
      },
    },
    {
      title: "Action",
      dataIndex: "id",
      render: (_, record) => {
        return (
          <>
            <Button type="link" onClick={() => handleOnEdit(record)}>
              {text.editButton}
            </Button>
          </>
        );
      },
    },
  ];

  const fetchData = useCallback(async () => {
    try {
      const { data: apiData } = await api.get("/administration-attributes");
      const _dataset = apiData.map((d) => ({
        ...d,
        attribute_for: "administration",
      }));
      setDataset(_dataset);
      setLoading(false);
    } catch {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div id="users">
      <Row justify="space-between" align="bottom">
        <Col>
          <Breadcrumbs pagePath={pagePath} />
          <DescriptionPanel
            description={text.manageAttributeText}
            title={text.manageAttributes}
          />
        </Col>
      </Row>
      <ManageDataTab />

      <div className="table-section">
        <div className="table-wrapper">
          <AttributeFilters addLink="/master-data/attributes/add" />
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
              rowKey="id"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default MasterDataAttributes;
