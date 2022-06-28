import React, { useMemo, useState, useEffect, useCallback } from "react";
import "./style.scss";
import {
  Row,
  Col,
  Card,
  Button,
  Divider,
  Table,
  Modal,
  Space,
  Select,
  Input,
} from "antd";
import { Link } from "react-router-dom";
import { Breadcrumbs, DescriptionPanel } from "../../components";
import { api, store, uiText, config } from "../../lib";
import { useNotification } from "../../util/hooks";
import { orderBy, startCase } from "lodash";

const { Search } = Input;
const { Option } = Select;

const pagePath = [
  {
    title: "System Settings",
    link: "/settings",
  },
  {
    title: "Manage Organizations",
  },
];

const Organisations = () => {
  const { notify } = useNotification();

  const [loading, setLoading] = useState(true);
  const [attributes, setAttributes] = useState(null);
  const [search, setSearch] = useState(null);
  const [dataset, setDataset] = useState([]);
  const [deleteOrganisation, setDeleteOrganisation] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const { organisationAttributes } = config;
  const { language, isLoggedIn } = store.useState((s) => s);
  const { active: activeLang } = language;

  const text = useMemo(() => {
    return uiText[activeLang];
  }, [activeLang]);

  const descriptionData = <div>{text.orgPanelText}</div>;

  const columns = [
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
      width: 20,
      align: "center",
    },
    {
      title: "Organization",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Attributes",
      dataIndex: "attributes",
      key: "attributes",
      render: (attributes) =>
        attributes.length
          ? attributes
              .map(
                (a) =>
                  organisationAttributes.find((o) => o.id === a.type_id)?.name
              )
              .join(", ")
          : "-",
    },
    {
      title: "Users",
      dataIndex: "users",
      key: "users",
      render: (users) => users || " - ",
      width: 90,
      align: "center",
    },
    {
      title: "Action",
      key: "action",
      render: (record, rowValue) => (
        <Space>
          <Link to={`/organisation/${record.id}`}>
            <Button type="secondary" size="small">
              Edit
            </Button>
          </Link>
          <Button
            type="danger"
            size="small"
            ghost
            loading={deleting === record.id}
            onClick={() =>
              setDeleteOrganisation({ ...record, count: rowValue.users })
            }
          >
            Delete
          </Button>
        </Space>
      ),
      width: 120,
      align: "center",
    },
  ];

  const handleDelete = () => {
    setDeleting(deleteOrganisation.id);
    api
      .delete(`organisation/${deleteOrganisation.id}`)
      .then(() => {
        setDataset(dataset.filter((d) => d.id !== deleteOrganisation.id));
        setDeleteOrganisation(false);
        setDeleting(false);
        notify({
          type: "success",
          message: "Organization deleted",
        });
      })
      .catch((err) => {
        const { status, data } = err.response;
        if (status === 409) {
          notify({
            type: "error",
            message: data?.message || text.organisationDeleteFail,
          });
        } else {
          notify({
            type: "error",
            message: text.organisationDeleteFail,
          });
        }
        setDeleting(false);
        console.error(err.response);
      });
  };

  const fetchData = useCallback(() => {
    if (isLoggedIn) {
      let url = "organisations";
      setLoading(true);
      if (attributes) {
        url += `?attributes=${attributes}`;
      }
      if (attributes && search) {
        url += `&search=${search}`;
      }
      if (!attributes && search) {
        url += `?search=${search}`;
      }
      api
        .get(url)
        .then((res) => {
          setDataset(orderBy(res.data, ["id"], ["desc"]));
          setLoading(false);
        })
        .catch((err) => {
          notify({
            type: "error",
            message: text.organisationsLoadFail,
          });
          setLoading(false);
          console.error(err);
        });
    }
  }, [isLoggedIn, notify, text.organisationsLoadFail, attributes, search]);

  useEffect(() => {
    fetchData();
  }, [isLoggedIn, fetchData]);

  return (
    <div id="organisations">
      <Row justify="space-between" align="bottom">
        <Col>
          <Breadcrumbs pagePath={pagePath} />
          <DescriptionPanel description={descriptionData} />
        </Col>
        <Col>
          <Link to="/organisation/add">
            <Button type="primary">Add new organization</Button>
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
                setSearch(e.target.value?.length >= 2 ? e.target.value : null);
              }}
              style={{ width: 225 }}
              allowClear
            />
            <Select
              placeholder="Attributes"
              getPopupContainer={(trigger) => trigger.parentNode}
              style={{ width: 225 }}
              onChange={setAttributes}
              allowClear
            >
              {organisationAttributes?.map((o, oi) => (
                <Option key={`org-${oi}`} value={o.id}>
                  {o.name}
                </Option>
              ))}
            </Select>
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
            showTotal: (total, range) =>
              `Results: ${range[0]} - ${range[1]} of ${total} organisations`,
          }}
          rowKey="id"
        />
      </Card>

      {/* Modal */}
      <Modal
        visible={deleteOrganisation}
        onCancel={() => setDeleteOrganisation(null)}
        centered
        className="organisation-modal"
        width="575px"
        footer={
          <Row align="middle">
            <Col span={24} align="right">
              <Button
                className="light"
                disabled={deleting}
                onClick={() => {
                  setDeleteOrganisation(null);
                }}
              >
                Cancel
              </Button>
              <Button
                type="primary"
                danger
                loading={deleting}
                onClick={() => {
                  handleDelete();
                }}
              >
                Delete
              </Button>
            </Col>
          </Row>
        }
        bodyStyle={{ textAlign: "center" }}
      >
        <h3>{text.deleteOrganisationTitle}</h3>
        <br />
        <img src="/assets/personal-information.png" height="80" />
        <h2>{deleteOrganisation?.name}</h2>
        <p>{text.deleteOrganisationDesc(deleteOrganisation || { count: 0 })}</p>
      </Modal>
    </div>
  );
};

export default React.memo(Organisations);
