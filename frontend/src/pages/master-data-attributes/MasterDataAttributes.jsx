import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Button,
  Card,
  Col,
  Divider,
  Modal,
  Row,
  Table,
  Typography,
} from "antd";
import {
  AdministrationFilters,
  Breadcrumbs,
  DescriptionPanel,
  ManageDataTab,
} from "../../components";

import { api, store, uiText } from "../../lib";
import { useNavigate } from "react-router-dom";

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
  const navigate = useNavigate();

  const { language } = store.useState((s) => s);
  const { active: activeLang } = language;

  const text = useMemo(() => {
    return uiText[activeLang];
  }, [activeLang]);

  const handleOnDelete = (record) => {
    Modal.confirm({
      title: `Delete "${record?.name || "item"}"?`,
      onOk: async () => {
        try {
          setLoading(true);
          await api.delete(`/administration-attributes/${record?.id}`);
          const _dataset = dataset.filter((d) => d?.id !== record?.id);
          setDataset(_dataset);
          setLoading(false);
        } catch {
          setLoading(false);
        }
      },
    });
  };

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
      title: "Attribute Type",
      dataIndex: "attribute_type",
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
            <Button type="link" onClick={() => handleOnDelete(record)} danger>
              Delete
            </Button>
            <Button type="link" onClick={() => handleOnEdit(record)}>
              Edit
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
        attribute_type: "administration",
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
          <DescriptionPanel description={text.manageUserText} />
        </Col>
      </Row>
      <ManageDataTab />
      <AdministrationFilters addLink="/master-data/attributes/add" />
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
          rowKey="id"
        />
      </Card>
    </div>
  );
};

export default MasterDataAttributes;
