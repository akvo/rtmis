import React, { useState } from "react";
import { Row, Col, Table, Button, Space, Divider, Tooltip } from "antd";
import { Link } from "react-router-dom";
import { api, config, store } from "../../lib";

const UserDetail = ({ record, setDeleteUser, deleting }) => {
  const { user } = store.useState((state) => state);
  const [isFetchDeleteDetail, setIsFetchDeleteDetail] = useState(false);

  const handleOnClickDelete = () => {
    setIsFetchDeleteDetail(true);
    api.get(`user/${record.id}`).then((res) => {
      const { data } = res;
      const assosiations = [];
      Object.keys(data).forEach((key) => {
        const value = data[key];
        if (key === "pending_approval") {
          assosiations.push({
            name: "Pending Data Approval",
            count: value,
          });
        }
        if (key === "pending_batch") {
          assosiations.push({
            name: "Pending Batch Data Submitted",
            count: value,
          });
        }
        if (key === "data") {
          assosiations.push({
            name: "Data Submission",
            count: value,
          });
        }
      });
      setDeleteUser({ ...record, assosiations: assosiations });
      setIsFetchDeleteDetail(false);
    });
  };

  const columns = [
    {
      title: "Field",
      dataIndex: "field",
      key: "field",
      width: "50%",
    },
    {
      title: "Value",
      dataIndex: "value",
      key: "value",
    },
  ];

  return (
    <>
      <Row justify="center" key="top">
        <Col span={20}>
          <Table
            columns={columns}
            className="table-child"
            dataSource={[
              {
                key: "first_name",
                field: "First Name",
                value: record?.first_name || "",
              },
              {
                key: "last_name",
                field: "Last Name",
                value: record?.last_name || "",
              },
              {
                key: "organisation",
                field: "Organisation",
                value: record?.organisation?.name || "-",
              },
              {
                key: "invite",
                field: "Invitation Code",
                value: (
                  <Link to={`/login/${record?.invite}`}>
                    <Button size="small">Change Password</Button>
                  </Link>
                ),
              },
              {
                key: "designation",
                field: "Designation",
                value: `${
                  config?.designations?.find(
                    (d) => d.id === parseInt(record.designation)
                  )?.name || "-"
                }`,
              },
              {
                key: "phone_number",
                field: "Phone Number",
                value: `${record?.phone_number || "-"}`,
              },
              {
                key: "forms",
                field: "Forms",
                value: `${
                  record.forms.length !== 0
                    ? record.forms.map((item) => item.name)
                    : record.forms.length === 1
                    ? record.forms.map((item) => item.name) + ", "
                    : "-"
                }`,
              },
            ]}
            pagination={false}
          />
        </Col>
        <Divider />
      </Row>
      <div>
        <Space>
          <Link to={`/control-center/users/${record.id}`}>
            <Button type="primary" shape="round">
              Edit
            </Button>
          </Link>
          {user && user.email === record.email ? (
            <Tooltip title="Could not do self deletion">
              <Button danger shape="round" disabled>
                Delete
              </Button>
            </Tooltip>
          ) : (
            <Button
              danger
              loading={deleting || isFetchDeleteDetail}
              onClick={handleOnClickDelete}
              shape="round"
            >
              Delete
            </Button>
          )}
        </Space>
      </div>
    </>
  );
};

export default UserDetail;
