import React, { useMemo, useState, useEffect, useCallback } from "react";
import {
  Row,
  Col,
  Card,
  Button,
  Divider,
  Table,
  Space,
  Input,
  Modal,
} from "antd";
import { CloseSquareOutlined, PlusSquareOutlined } from "@ant-design/icons";
import { Link } from "react-router-dom";
import { Breadcrumbs, DescriptionPanel } from "../../components";
import { store, uiText } from "../../lib";
// import { api, store, uiText, config } from "../../lib";
import DetailAssignment from "./DetailAssignment";
// import { orderBy } from "lodash";

const { Search } = Input;

const pagePath = [
  {
    title: "Control Center",
    link: "/control-center",
  },
  {
    title: "Mobile Data Collectors",
  },
];

const fakeAssignments = [
  {
    id: 1,
    name: "Jhon Doe",
    passcode: "h3llo7",
    administrations: [
      {
        id: 11,
        name: "Central Kasipul",
      },
      {
        id: 12,
        name: "East Kamagak",
      },
    ],
    forms: [
      {
        id: 519630048,
        name: "Household",
      },
      {
        id: 563350033,
        name: "WASH in schools",
      },
    ],
  },
];

const MobileAssignment = () => {
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(null);
  const [dataset, setDataset] = useState([]);
  const [deleteUser, setDeleteUser] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);

  const { language } = store.useState((s) => s);
  const { active: activeLang } = language;
  const newAssignment = store.useState((s) => s.mobileAssignment);

  const text = useMemo(() => {
    return uiText[activeLang];
  }, [activeLang]);

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
      title: "Village",
      dataIndex: "administrations",
      key: "administrations",
      render: (record) => {
        return <>{record?.map((r) => r?.name || r?.label)?.join(" | ")}</>;
      },
    },
    {
      title: "Forms",
      dataIndex: "forms",
      key: "Forms",
      render: (record) => {
        return <>{record?.map((r) => r?.name || r?.label)?.join(" | ")}</>;
      },
    },
    Table.EXPAND_COLUMN,
  ];

  const handleOnDelete = async () => {
    setDeleteUser(null);
    setDeleting(true);
    await new Promise((r) => setTimeout(r, 2000));
    setDataset(dataset.slice(-1));
    setDeleting(false);
  };

  const fetchData = useCallback(async () => {
    // TODO
    await new Promise((r) => setTimeout(r, 2000));
    setDataset(fakeAssignments);
    if (Object.keys(newAssignment).length) {
      setDataset([newAssignment, ...fakeAssignments]);
    }
    setTotalCount(1);
    setCurrentPage(1);
    setLoading(false);
  }, [newAssignment]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div id="mobile-assignments">
      <Row justify="space-between" align="bottom">
        <Col>
          <Breadcrumbs pagePath={pagePath} />
          <DescriptionPanel description={descriptionData} />
        </Col>
        <Col>
          <Link to="/mobile-assignment/form">
            <Button type="primary">{text.mobileButtonAdd}</Button>
          </Link>
        </Col>
      </Row>
      <Divider />

      {/* Filter */}
      <Row>
        <Col span={20}>
          <Space>
            <Search
              placeholder="Search..."
              onChange={(e) => {
                setSearch(e.target.value);
              }}
              style={{ width: 225 }}
              value={search}
              allowClear
            />
          </Space>
        </Col>
      </Row>
      <Divider />

      {/* Table start here */}
      <Card
        style={{ padding: 0, minHeight: "40vh" }}
        bodyStyle={{ padding: 0 }}
      >
        <Table
          columns={columns}
          rowClassName={() => "editable-row"}
          dataSource={dataset}
          loading={loading}
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
              <DetailAssignment
                record={record}
                setDeleteUser={setDeleteUser}
                deleting={deleting}
              />
            ),
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
      </Card>
      <Modal
        title={deleteUser?.name}
        visible={deleteUser}
        onOk={handleOnDelete}
        onCancel={() => setDeleteUser(null)}
      >
        <p>{text.mobileConfirmDeletion}</p>
      </Modal>
    </div>
  );
};

export default React.memo(MobileAssignment);
