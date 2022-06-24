import React, { useMemo, useState, useEffect, useCallback } from "react";
import "./style.scss";
import { Row, Col, Card, Button, Divider, Table, Modal, Space } from "antd";
import { Link } from "react-router-dom";
import { Breadcrumbs, DescriptionPanel } from "../../components";
import { api, store, uiText } from "../../lib";
import { useNotification } from "../../util/hooks";
import orderBy from "lodash/orderBy";

const pagePath = [
  {
    title: "Settings",
    link: "/settings",
  },
  {
    title: "Manage Organizations",
  },
];

const Organisations = () => {
  const { notify } = useNotification();

  const [loading, setLoading] = useState(true);
  const [dataset, setDataset] = useState([]);
  const [deleteOrganisation, setDeleteOrganisation] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const { language, isLoggedIn } = store.useState((s) => s);
  const { active: activeLang } = language;

  const text = useMemo(() => {
    return uiText[activeLang];
  }, [activeLang]);

  const descriptionData = <div>{text.orgPanelText}</div>;

  const columns = [
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
        attributes.length ? attributes.map((a) => a.name).join(", ") : "-",
    },
    {
      title: "Action",
      key: "action",
      render: (record) => (
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
            onClick={() => setDeleteOrganisation(record)}
          >
            Delete
          </Button>
        </Space>
      ),
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
      const url = "organisations";
      setLoading(true);
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
  }, [isLoggedIn, notify, text.organisationsLoadFail]);

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
        width="575px"
        footer={
          <Row justify="center" align="middle">
            <Col span={14}>
              <i>{text.deleteOrganisationHint}</i>
            </Col>
            <Col span={10}>
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
        <p>{text.deleteOrganisationTitle}</p>
        <br />
        <img src="/assets/personal-information.png" height="80" />
        <h2>{deleteOrganisation?.name}</h2>
        <p>{text.deleteOrganisationDesc}</p>
      </Modal>
    </div>
  );
};

export default React.memo(Organisations);
