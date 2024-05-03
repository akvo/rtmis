import React, { useState, useEffect, useMemo } from "react";
import "./style.scss";
import {
  Row,
  Col,
  Divider,
  Table,
  Typography,
  ConfigProvider,
  Empty,
  Button,
  Tag,
} from "antd";
import {
  LeftCircleOutlined,
  DownCircleOutlined,
  ArrowLeftOutlined,
} from "@ant-design/icons";
import { useParams, useNavigate } from "react-router-dom";
import { api, config, store, uiText } from "../../lib";
import { Breadcrumbs, DescriptionPanel } from "../../components";
import CertificationDataDetail from "./CertificationDataDetail";

const { Title } = Typography;

const CertificationDetail = () => {
  const [loading, setLoading] = useState(false);
  const [dataset, setDataset] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [updateRecord, setUpdateRecord] = useState(false);
  const { form, parentId } = useParams();
  const navigate = useNavigate();

  const language = store.useState((s) => s.language);
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
      title: text.ManageCertificationDataTitle,
      link: "/control-center/certification-data",
    },
    {
      title: text.CertificationDetailTitle,
    },
  ];

  const questionGroups = store.useState((state) => state.questionGroups);

  const columns = [
    {
      title: "Last Updated",
      dataIndex: "updated",
      render: (cell, row) => cell || row.created,
    },
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Type",
      dataIndex: "submission_type",
      key: "submission_type",
      render: (cell) => {
        const indexType = Object.values(config?.submissionType).findIndex(
          (st) => st === cell
        );
        const subTypeName =
          Object.keys(config.submissionType)?.[indexType] || "registration";
        return (
          <Tag color={config.submissionTypeColor?.[subTypeName]}>
            {subTypeName}
          </Tag>
        );
      },
    },
    {
      title: "User",
      dataIndex: "created_by",
    },
    Table.EXPAND_COLUMN,
  ];

  const handleChange = (e) => {
    setCurrentPage(e.current);
  };

  useEffect(() => {
    if (form && !updateRecord) {
      setLoading(true);
      const url = `/certifications/${form}/?page=${currentPage}&parent=${parentId}`;
      api
        .get(url)
        .then((res) => {
          setDataset(res.data.data);
          setTotalCount(res.data.total);
          setUpdateRecord(null);
          setLoading(false);
        })
        .catch(() => {
          setDataset([]);
          setTotalCount(0);
          setLoading(false);
        });
    }
  }, [form, currentPage, updateRecord, parentId]);

  useEffect(() => {
    if (form && window?.forms?.length && questionGroups.length === 0) {
      store.update((s) => {
        s.questionGroups = window.forms.find(
          (f) => `${f?.id}` === form
        )?.content?.question_group;
      });
    }
  }, [questionGroups, form]);

  return (
    <div id="manageData">
      <div className="description-container">
        <Row justify="space-between">
          <Col>
            <Breadcrumbs pagePath={pagePath} />
            <DescriptionPanel
              description={text.CertificationDetailText}
              title={text.CertificationDetailTitle}
            />
          </Col>
        </Row>
      </div>

      <div className="table-section">
        <div className="table-wrapper">
          <Row justify={"space-between"} align={"middle"}>
            <Col span={6}>
              <Button
                shape="round"
                onClick={() => navigate("/control-center/certification-data")}
                icon={<ArrowLeftOutlined />}
              >
                {text.backManageCertificationData}
              </Button>
            </Col>
          </Row>
          <Divider />
          <Title>{dataset?.[0]?.name}</Title>
          <div
            style={{ padding: "16px 0 0", minHeight: "40vh" }}
            bodystyle={{ padding: 0 }}
          >
            <ConfigProvider
              renderEmpty={() => <Empty description={text.noFormText} />}
            >
              <Table
                columns={columns}
                dataSource={dataset}
                loading={loading}
                onChange={handleChange}
                pagination={{
                  current: currentPage,
                  total: totalCount,
                  pageSize: 10,
                  showSizeChanger: false,
                  showTotal: (total, range) =>
                    `Results: ${range[0]} - ${range[1]} of ${total} data`,
                }}
                rowKey="id"
                expandable={{
                  expandedRowRender: (record) => (
                    <CertificationDataDetail
                      questionGroups={questionGroups}
                      record={record}
                    />
                  ),
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
                rowClassName="expandable-row row-normal sticky"
                expandRowByClick
              />
            </ConfigProvider>
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(CertificationDetail);
