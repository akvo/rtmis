import { Row, Col, Table, Button, Checkbox, Space, Divider } from "antd";
import { Link } from "react-router-dom";

const UserDetail = (record) => {
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
  return [
    <Row justify="center" key="top">
      <Col span={20}>
        <Table
          columns={columns}
          className="table-child"
          dataSource={[
            {
              key: "name",
              field: "Name",
              value: `${record.first_name} ${record.last_name}`,
            },
            {
              key: "organisation",
              field: "Organisation",
              value: "-",
            },
            {
              key: "role",
              field: "Role",
              value: `${record?.role?.value || "-"}`,
            },
            {
              key: "invite",
              field: "Invitation Code",
              value: (
                <Link to={`/login/${record?.invite}`}>
                  <Button className="dev" size="small">
                    Change Password [Dev Only]
                  </Button>
                </Link>
              ),
            },
            {
              key: "region",
              field: "Region",
              value: `${record?.administration?.name || "-"}`,
            },
          ]}
          pagination={false}
        />
      </Col>
      <Divider />
    </Row>,
    <Row justify="center" key="bottom">
      <Col span={10}>
        <Checkbox onChange={() => {}}>Inform User of Changes</Checkbox>
      </Col>
      <Col span={10} align="right">
        <Space>
          <Link to={"/user/edit/" + record.id}>
            <Button className="light">Edit</Button>
          </Link>
          <Button danger>Delete</Button>
        </Space>
      </Col>
    </Row>,
  ];
};

export default UserDetail;
