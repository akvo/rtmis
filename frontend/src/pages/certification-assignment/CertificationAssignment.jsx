import React, { useState, useMemo, useCallback, useEffect } from "react";
import { Row, Col, Button, Divider, Space, Table } from "antd";
import {
  DownCircleOutlined,
  PlusOutlined,
  LeftCircleOutlined,
} from "@ant-design/icons";
import { Link, useNavigate } from "react-router-dom";
import moment from "moment";
import {
  AdministrationDropdown,
  Breadcrumbs,
  DescriptionPanel,
  RemoveFiltersButton,
} from "../../components";
import { api, store, uiText } from "../../lib";
import DetailCertify from "./DetailCertify";

const CertificationAssignment = () => {
  const [loading, setLoading] = useState(true);
  const [dataset, setDataset] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);

  const navigate = useNavigate();
  const { language, administration } = store.useState((s) => s);
  const { active: activeLang } = language;

  const isAdministrationLoaded = administration.length;
  const selectedAdministration =
    administration.length > 0
      ? administration[administration.length - 1]
      : null;

  const text = useMemo(() => {
    return uiText[activeLang];
  }, [activeLang]);

  const handleOnEdit = (data) => {
    navigate(`/control-center/certification/${data.id}/edit`);
  };

  const pagePath = [
    {
      title: text.controlCenter,
      link: "/control-center",
    },
    {
      title: text.certificationTitle,
    },
  ];

  const columns = [
    {
      title: "#",
      key: "index",
      render: (row, record, index) =>
        index + 1 /* eslint-disable no-unused-vars */,
    },
    {
      title: "Certifying Sub-county",
      dataIndex: "assignee",
      key: "subcounty_certifying",
      render: (record) => record?.full_name,
    },
    {
      title: "To certify",
      dataIndex: "administrations",
      key: "administration_count",
      render: (record) => {
        return <>{`${record?.length} Village(s)`}</>;
      },
    },
    {
      title: "Last updated",
      dataIndex: "updated",
      key: "updated",
      render: (record) =>
        record
          ? moment(record, "DD-MM-YYYY hh:mm:ss").format("MMMM Do YYYY hh:mm a")
          : "-",
    },
    {
      title: "Action",
      dataIndex: "id",
      key: "id",
      width: "10%",
      render: (_, record) => {
        return (
          <Button
            shape="round"
            type="primary"
            onClick={() => handleOnEdit(record)}
          >
            {text.editButton}
          </Button>
        );
      },
    },
    Table.EXPAND_COLUMN,
  ];

  const fetchData = useCallback(
    async (selectedAdministration) => {
      try {
        let url = `/form/certification-assignment?page=${currentPage}`;
        if (selectedAdministration) {
          url += `&administration=${selectedAdministration.id}`;
        }
        const { data: apiData } = await api.get(url);
        const { total, current, data: assignments } = apiData || {};
        setDataset(assignments);
        setTotalCount(total);
        setCurrentPage(current);
        setLoading(false);
      } catch {
        setLoading(false);
      }
    },
    [currentPage]
  );

  useEffect(() => {
    if (isAdministrationLoaded) {
      fetchData(selectedAdministration);
    }
  }, [fetchData, selectedAdministration, isAdministrationLoaded]);

  return (
    <div id="mobile-assignments">
      <div className="description-container">
        <Row justify="space-between" align="bottom">
          <Col>
            <Breadcrumbs pagePath={pagePath} />
            <DescriptionPanel
              description={text.certificationDesc}
              title={text.certificationTitle}
            />
          </Col>
        </Row>
      </div>

      <div className="table-section">
        <div className="table-wrapper">
          <Row>
            <Col flex={1}>
              <Space>
                <AdministrationDropdown persist={true} />
                <RemoveFiltersButton />
              </Space>
            </Col>
            <Col>
              <Link to="/control-center/certification/add">
                <Button icon={<PlusOutlined />} type="primary" shape="round">
                  {text.certificationAdd}
                </Button>
              </Link>
            </Col>
          </Row>
          <Divider />
          {/* Table start here */}
          <div
            style={{ padding: 0, minHeight: "40vh" }}
            bodystyle={{ padding: 0 }}
          >
            <Table
              columns={columns}
              dataSource={dataset}
              loading={loading}
              onChange={(e) => setCurrentPage(e.current)}
              pagination={{
                showSizeChanger: false,
                current: currentPage,
                total: totalCount,
                pageSize: 10,
                showTotal: (total, range) =>
                  `Results: ${range[0]} - ${range[1]} of ${total} users`,
              }}
              rowKey="id"
              expandable={{
                expandedRowRender: (record) => (
                  <DetailCertify record={record} />
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
              rowClassName="expandable-row editable-row"
              expandRowByClick
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CertificationAssignment;
