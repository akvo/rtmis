import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Button, Col, Divider, Row, Table, Typography } from "antd";
import {
  AttributeFilters,
  Breadcrumbs,
  DescriptionPanel,
} from "../../components";

import { api, store, uiText } from "../../lib";
import { useNavigate } from "react-router-dom";

const { Text } = Typography;

const MasterDataAttributes = () => {
  const [loading, setLoading] = useState(true);
  const [dataset, setDataset] = useState([]);
  const [datasetBackup, setdatasetBackup] = useState([]);
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
    navigate(`/control-center/master-data/attributes/${record.id}`);
  };

  const columns = [
    {
      title: "Attribute Name",
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
      width: "10%",
      dataIndex: "id",
      render: (_, record) => {
        return (
          <>
            <Button
              shape="round"
              type="primary"
              onClick={() => handleOnEdit(record)}
            >
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
      setDataset(apiData);
      setdatasetBackup(apiData);
      setLoading(false);
    } catch {
      setLoading(false);
    }
  }, []);

  const handleAttributeFilter = useCallback(
    (value) => {
      const filteredDataset = datasetBackup.filter(
        (data) => data.type === value
      );
      setDataset(filteredDataset);
    },
    [datasetBackup, setDataset]
  );

  const handleAttributeClearFilter = () => {
    fetchData();
  };

  const onSearchChange = useCallback(
    (value) => {
      const filterDataset = () => {
        const filtered = dataset.filter((data) => {
          const nameMatch = data.name
            .toLowerCase()
            .includes(value.toLowerCase());
          return nameMatch;
        });
        setDataset(filtered);
      };
      if (value !== "") {
        filterDataset();
      } else if (value === "") {
        setDataset(datasetBackup);
      }
    },
    [dataset, setDataset, datasetBackup]
  );

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div id="masterDataAttributes">
      <div className="description-container">
        <Row justify="space-between" align="bottom">
          <Col>
            <Breadcrumbs pagePath={pagePath} />
            <DescriptionPanel
              description={text.manageAttributeText}
              title={text.manageAttributes}
            />
          </Col>
        </Row>
      </div>

      <div className="table-section">
        <div className="table-wrapper">
          <AttributeFilters
            handleAttributeFilter={handleAttributeFilter}
            handleAttributeClearFilter={handleAttributeClearFilter}
            onSearchChange={onSearchChange}
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
              rowKey="id"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default MasterDataAttributes;
