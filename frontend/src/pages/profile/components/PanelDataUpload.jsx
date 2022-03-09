import React, { useMemo, useState, useEffect } from "react";
import {
  Card,
  Table,
  Tabs,
  Row,
  Button,
  Col,
  Checkbox,
  Modal,
  Select,
} from "antd";
import { FileTextFilled, InfoCircleOutlined } from "@ant-design/icons";
import { DataFilters } from "../../../components";
import { api, store } from "../../../lib";

const { TabPane } = Tabs;
const { Option } = Select;

const datasetApproved = [
  {
    key: "1",
    name: "Single Form CSV",
    multiple: false,
    created: "2021-11-08 17:18",
    administration: "Baringo",
    user: {
      id: 42,
      name: "Ouma Odhiambo",
    },
  },
  {
    key: "2",
    name: "Bulk Upload CSV",
    multiple: true,
    created: "2021-11-08 17:18",
    administration: "Busia",
    user: {
      id: 42,
      name: "John Doe",
    },
  },
  {
    key: "3",
    name: "Single Form CSV",
    multiple: false,
    created: "2021-11-08 17:18",
    administration: "Baringo",
    user: {
      id: 42,
      name: "Ouma Odhiambo",
    },
  },
  {
    key: "4",
    name: "Bulk Upload CSV",
    multiple: true,
    created: "2021-11-08 17:18",
    administration: "Baringo",
    user: {
      id: 42,
      name: "Ouma Odhiambo",
    },
  },
  {
    key: "5",
    name: "Bulk Upload CSV",
    multiple: true,
    created: "2021-11-08 17:18",
    administration: "Embu",
    user: {
      id: 42,
      name: "Ouma Odhiambo",
    },
  },
  {
    key: "6",
    name: "Single Form CSV",
    multiple: false,
    created: "2021-11-08 17:18",
    administration: "Lembus",
    user: {
      id: 42,
      name: "Ouma Odhiambo",
    },
  },
  {
    key: "7",
    name: "Bulk Upload CSV",
    multiple: true,
    created: "2021-11-08 17:18",
    administration: "Marigat",
    user: {
      id: 42,
      name: "Ouma Odhiambo",
    },
  },
  {
    key: "8",
    name: "Bulk Upload CSV",
    multiple: true,
    created: "2021-11-08 17:18",
    administration: "Baringo",
    user: {
      id: 42,
      name: "Ouma Odhiambo",
    },
  },
];

const columnsSelected = [
  {
    title: "Dataset",
    dataIndex: "name",
    key: "name",
  },
  {
    title: "Date Uploaded",
    dataIndex: "created",
    key: "created",
  },
  {
    title: "",
    render: () => <Checkbox />,
  },
];

const columnsApproved = [
  {
    title: "",
    dataIndex: "key",
    key: "key",
    render: () => <InfoCircleOutlined />,
    width: 50,
  },
  {
    title: "File",
    dataIndex: "name",
    key: "name",
    render: (name, row) => (
      <Row align="middle">
        <Col>
          <FileTextFilled style={{ color: "#666666", fontSize: 28 }} />
        </Col>
        <Col>
          <div>{name}</div>
          <div>{row.created}</div>
        </Col>
      </Row>
    ),
    sorter: (a, b) => a.name.localeCompare(b.name),
    sortDirections: ["ascend", "descend"],
  },
  {
    title: "administration",
    dataIndex: "administration",
    key: "administration",
    sorter: (a, b) => a.administration.localeCompare(b.administration),
    sortDirections: ["ascend", "descend"],
  },
  {
    title: "Approved By",
    dataIndex: "user",
    render: (user) => user.name || "",
    key: "user.id",
    sorter: (a, b) => a.user.name.localeCompare(b.user.name),
    sortDirections: ["ascend", "descend"],
  },
];

const PanelDataUpload = () => {
  const [selectedRows, setSelectedRows] = useState([]);
  const [datasetPending, setDatasetPending] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const { selectedForm } = store.useState((state) => state);

  useEffect(() => {
    if (selectedForm) {
      setLoading(true);
      const url = `/form-pending-data/${selectedForm}/?page=${currentPage}`;
      api
        .get(url)
        .then((res) => {
          setDatasetPending(res.data.data);
          setTotalCount(res.data.total);
          setLoading(false);
        })
        .catch(() => {
          setDatasetPending([]);
          setTotalCount(0);
          setLoading(false);
        });
    }
  }, [selectedForm, currentPage]);

  const handlePageChange = (e) => {
    setCurrentPage(e.current);
  };

  const handleSelect = (row) => {
    const resultIndex = selectedRows.findIndex((sR) => sR.key === row.key);
    if (resultIndex === -1) {
      setSelectedRows([...selectedRows, row]);
    } else {
      const clonedRows = JSON.parse(JSON.stringify(selectedRows));
      clonedRows.splice(resultIndex, 1);
      setSelectedRows(clonedRows);
    }
  };

  const btnBatchSelected = useMemo(() => {
    if (selectedRows.length > 0) {
      return (
        <Button
          className="dev"
          onClick={() => {
            setModalVisible(true);
          }}
        >
          Batch Selected Datasets
        </Button>
      );
    }
    return "";
  }, [selectedRows]);

  const columnsPending = [
    {
      title: "",
      dataIndex: "key",
      key: "key",
      render: () => <InfoCircleOutlined />,
      width: 50,
    },
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      render: (name, row) => (
        <Row align="middle">
          <Col>
            <FileTextFilled style={{ color: "#666666", fontSize: 28 }} />
          </Col>
          <Col>
            <div>{name}</div>
            <div>{row.created}</div>
          </Col>
        </Row>
      ),
      sorter: (a, b) => a.name.localeCompare(b.name),
      sortDirections: ["ascend", "descend"],
    },
    {
      title: "administration",
      dataIndex: "administration",
      key: "administration",
      sorter: (a, b) => a.administration.localeCompare(b.administration),
      sortDirections: ["ascend", "descend"],
    },
    {
      title: "Batch Datasets",
      render: (row) => (
        <Checkbox
          onChange={() => {
            handleSelect(row);
          }}
        />
      ),
    },
  ];

  return (
    <>
      <Card
        style={{
          padding: 0,
          minHeight: "40vh",
        }}
      >
        <h1>Data Uploads</h1>
        <DataFilters />
        <Tabs
          defaultActiveKey="1"
          onChange={() => {}}
          tabBarExtraContent={btnBatchSelected}
        >
          <TabPane tab="Pending Submission" key="1">
            <Table
              loading={loading}
              dataSource={datasetPending}
              columns={columnsPending}
              pagination={{
                current: currentPage,
                total: totalCount,
                pageSize: 10,
                showSizeChanger: false,
              }}
              rowKey="id"
            />
          </TabPane>
          <TabPane tab="Approved Uploads" key="2">
            <Table
              className="dev"
              loading={loading}
              dataSource={datasetApproved}
              columns={columnsApproved}
              pagination={false}
              scroll={{ y: 270 }}
              rowKey="key"
            />
          </TabPane>
        </Tabs>
      </Card>
      <Modal
        visible={modalVisible}
        onCancel={() => {
          setModalVisible(false);
        }}
        footer={
          <Row>
            <Col xs={12} align="left">
              <Checkbox>Send a new approval request</Checkbox>
            </Col>
            <Col xs={12}>
              <Button
                className="light"
                onClick={() => {
                  setModalVisible(false);
                }}
              >
                Cancel
              </Button>
              <Button className="dev">Create a new batch</Button>
            </Col>
          </Row>
        }
      >
        <p>You are about to create a Batch CSV File</p>
        <p>
          <FileTextFilled style={{ color: "#666666", fontSize: 64 }} />
        </p>
        <p>
          The operation of merging datasets cannot be undone, and will Create a
          new batch that will require approval from you admin
        </p>
        <Card style={{ padding: 0 }} bodyStyle={{ padding: 0 }}>
          <Table
            dataSource={selectedRows}
            columns={columnsSelected}
            pagination={false}
            scroll={{ y: 270 }}
            rowKey="key"
          />
          <div>
            <label>Approver</label>
          </div>
          <Select defaultValue="admin" style={{ width: 120 }}>
            <Option value="admin">Auma Awiti</Option>
          </Select>
        </Card>
      </Modal>
    </>
  );
};

export default PanelDataUpload;
