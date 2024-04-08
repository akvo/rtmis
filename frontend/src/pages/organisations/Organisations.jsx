import React, { useMemo, useState, useEffect, useCallback } from "react";
import "./style.scss";
import {
  Row,
  Col,
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
import { orderBy } from "lodash";
import { PlusOutlined } from "@ant-design/icons";

const { Search } = Input;
const { Option } = Select;

const Organisations = () => {
  const { notify } = useNotification();

  const [loading, setLoading] = useState(true);
  const [dataset, setDataset] = useState([]);
  const [deleteOrganisation, setDeleteOrganisation] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const { organisationAttributes } = config;
  const { language, isLoggedIn, filters } = store.useState((s) => s);
  const { active: activeLang } = language;

  const { query: search, attributeType: attributes } = filters;

  const text = useMemo(() => {
    return uiText[activeLang];
  }, [activeLang]);

  const pagePath = [
    {
      title: text.controlCenter,
      link: "/control-center",
    },
    {
      title: text.manageOrganisations,
    },
  ];

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
          <Link to={`/control-center/master-data/organisations/${record.id}`}>
            <Button shape="round" type="primary">
              {text.editButton}
            </Button>
          </Link>
          <Button
            shape="round"
            type="danger"
            ghost
            loading={deleting === record.id}
            onClick={() =>
              setDeleteOrganisation({ ...record, count: rowValue.users })
            }
          >
            {text.deleteText}
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

  const fetchData = useCallback(
    (search, attributes) => {
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
    },
    [isLoggedIn, notify, text.organisationsLoadFail]
  );

  useEffect(() => {
    fetchData(search, attributes);
  }, [isLoggedIn, fetchData, search, attributes]);

  return (
    <div id="organisations">
      <div className="description-container">
        <Row justify="space-between" align="bottom">
          <Col>
            <Breadcrumbs pagePath={pagePath} />
            <DescriptionPanel
              description={descriptionData}
              title={text.manageOrganisations}
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
                  placeholder={text.searchPlaceholder}
                  onChange={(e) => {
                    store.update((s) => {
                      s.filters.query = e.target.value;
                    });
                  }}
                  onSearch={(value) => fetchData(value, attributes)}
                  style={{ width: 225 }}
                  allowClear
                  value={search}
                />
                <Select
                  placeholder="Attributes"
                  getPopupContainer={(trigger) => trigger.parentNode}
                  style={{ width: 225 }}
                  onChange={(value) => {
                    store.update((s) => {
                      s.filters.attributeType = value;
                    });
                  }}
                  allowClear
                  value={attributes}
                >
                  {organisationAttributes?.map((o, oi) => (
                    <Option key={`org-${oi}`} value={o.id}>
                      {o.name}
                    </Option>
                  ))}
                </Select>
              </Space>
            </Col>
            <Col>
              <Link to="/control-center/master-data/organisations/add">
                <Button type="primary" shape="round" icon={<PlusOutlined />}>
                  {text.addNewButton}
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
          </div>
        </div>
      </div>

      {/* Modal */}
      <Modal
        open={deleteOrganisation}
        onCancel={() => setDeleteOrganisation(null)}
        centered
        className="organisation-modal"
        width="575px"
        footer={
          <Row align="middle">
            <Col span={24} align="right">
              <Button
                shape="round"
                className="light"
                disabled={deleting}
                onClick={() => {
                  setDeleteOrganisation(null);
                }}
              >
                {text.cancelButton}
              </Button>
              <Button
                shape="round"
                type="primary"
                danger
                loading={deleting}
                onClick={() => {
                  handleDelete();
                }}
              >
                {text.deleteText}
              </Button>
            </Col>
          </Row>
        }
        bodystyle={{ textAlign: "center" }}
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
