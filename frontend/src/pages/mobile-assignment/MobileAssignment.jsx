import React, { useMemo, useState, useEffect, useCallback } from "react";
import { Row, Col, Button, Divider, Table, Space, Input } from "antd";
import {
  DownCircleOutlined,
  PlusOutlined,
  LeftCircleOutlined,
} from "@ant-design/icons";
import { Link, useNavigate } from "react-router-dom";
import { Breadcrumbs, DescriptionPanel } from "../../components";
import { api, store, uiText } from "../../lib";
import DetailAssignment from "./DetailAssignment";

const { Search } = Input;

const MobileAssignment = () => {
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(null);
  const [dataset, setDataset] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedRows, setExpandedRows] = useState({});

  const navigate = useNavigate();
  const { language, user: authUser } = store.useState((s) => s);
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
      title: text.mobilePanelTitle,
    },
  ];

  const handleOnEdit = (record) => {
    navigate(`/control-center/mobile-assignment/${record?.id}`);
  };

  const handleMoreLinkClick = (rowKey) => {
    setExpandedRows((prevExpandedRows) => ({
      ...prevExpandedRows,
      [rowKey]: !prevExpandedRows[rowKey],
    }));
  };

  const descriptionData = <div>{text.mobilePanelText}</div>;

  const columns = [
    {
      title: "#",
      key: "index",
      render: (row, record, index) =>
        index + 1 /* eslint-disable no-unused-vars */,
    },
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Administrations",
      dataIndex: "administrations",
      key: "administrations",
      render: (record, row) => {
        const displayedItems = expandedRows[row.id]
          ? record
          : record?.slice(0, 4);

        return (
          <>
            {displayedItems?.map((r) => r?.name || r?.label)?.join(" , ")}
            {record?.length > 4 && (
              <a onClick={() => handleMoreLinkClick(row.id)}>
                {expandedRows[row.id]
                  ? ` - Less`
                  : ` + ${record?.slice(4).length} More`}
              </a>
            )}
          </>
        );
      },
    },
    {
      title: "Forms",
      dataIndex: "forms",
      key: "Forms",
      render: (record) => {
        return <>{record?.map((r) => r?.name || r?.label)?.join(" | ")}</>;
      },
      width: 500,
    },
    {
      title: "Created by",
      dataIndex: "created_by",
      key: "created_by",
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
            disabled={
              record.created_by !== authUser.email &&
              authUser.administration.level !== 2
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

  const fetchData = useCallback(async () => {
    try {
      const { data: apiData } = await api.get(
        `/mobile-assignments?page=${currentPage}`
      );
      const { total, current, data: _assignments } = apiData || {};
      setDataset(_assignments);
      setTotalCount(total);
      setCurrentPage(current);
      setLoading(false);
    } catch {
      setLoading(false);
    }
  }, [currentPage]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div id="mobile-assignments">
      <div className="description-container">
        <Row justify="space-between" align="bottom">
          <Col>
            <Breadcrumbs pagePath={pagePath} />
            <DescriptionPanel
              description={descriptionData}
              title={text.mobilePanelTitle}
            />
          </Col>
        </Row>
      </div>

      <div className="table-section">
        <div className="table-wrapper">
          {/* Filter */}
          <Row>
            <Col flex={1}>
              <Space>
                <Search
                  placeholder="Search..."
                  onChange={(e) => {
                    setSearch(e.target.value);
                  }}
                  style={{ width: 425 }}
                  value={search}
                  allowClear
                />
              </Space>
            </Col>
            <Col>
              <Link to="/control-center/mobile-assignment/add">
                <Button icon={<PlusOutlined />} type="primary" shape="round">
                  {text.mobileButtonAdd}
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
              onChange={handleChange}
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
                  <DetailAssignment record={record} />
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

export default React.memo(MobileAssignment);
