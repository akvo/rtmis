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

  const { language, filters } = store.useState((s) => s);
  const { active: activeLang } = language;

  const { query, attributeType } = filters;

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

  const filterDataset = (dataset = [], query = null, attributeType = null) => {
    const filtered = dataset
      .filter((data) => {
        if (query) {
          const nameMatch = data.name
            .toLowerCase()
            .includes(query.toLowerCase());
          return nameMatch;
        }
        return data;
      })
      .filter((data) => {
        if (attributeType) {
          const match = data.type === attributeType;
          return match;
        }
        return data;
      });
    setDataset(filtered);
  };

  const fetchData = useCallback(async (query, attributeType) => {
    try {
      const { data: apiData } = await api.get("/administration-attributes");
      setdatasetBackup(apiData);
      if (query || attributeType) {
        filterDataset(apiData, query, attributeType);
      } else {
        setDataset(apiData);
      }
      setLoading(false);
    } catch {
      setLoading(false);
    }
  }, []);

  const handleAttributeFilter = useCallback(
    (value) => {
      store.update((s) => {
        s.filters.attributeType = value;
      });
      filterDataset(datasetBackup, query, value);
    },
    [datasetBackup, query]
  );

  const handleAttributeClearFilter = () => {
    store.update((s) => {
      s.filters.query = null;
      s.filters.attributeType = null;
    });
    fetchData();
  };

  const onSearchChange = useCallback(
    (value) => {
      if (value || attributeType) {
        filterDataset(datasetBackup, value, attributeType);
      } else {
        setDataset(datasetBackup);
      }
    },
    [setDataset, datasetBackup, attributeType]
  );

  useEffect(() => {
    if (query) {
      onSearchChange(query);
    }
  }, [query, onSearchChange]);

  useEffect(() => {
    fetchData(query, attributeType);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
            onChange={(value) => {
              store.update((s) => {
                s.filters.query = value;
              });
            }}
            query={query}
            selectedAttribute={attributeType}
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
