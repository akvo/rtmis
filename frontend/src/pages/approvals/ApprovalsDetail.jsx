import React from "react";
import { Row, Col, Table, Tabs, Input, Checkbox, Button, Space } from "antd";

const { TextArea } = Input;
const { TabPane } = Tabs;

const columnsRawData = [
  {
    title: "",
    dataIndex: "key",
    key: "key",
    width: 40,
    render: (_, __, a) => {
      return a + 1;
    },
  },
  {
    title: "Name",
    dataIndex: "name",
    key: "name",
  },
  {
    title: "Administration",
    dataIndex: "administration",
    key: "administration",
    align: "center",
  },
  {
    title: "Date",
    dataIndex: "created",
    key: "created",
  },
  {
    title: "Upload By",
    dataIndex: "created_by",
    key: "created_by",
    width: 200,
  },
];

const ApprovalDetail = ({ record, loading }) => {
  return (
    <div>
      <Tabs centered defaultActiveKey="1" onChange={() => {}}>
        <TabPane tab="Data Summary" key="1">
          <div>
            <table className="dev">
              <thead>
                <tr>
                  <th>Field</th>
                  <th>Value</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>County</td>
                  <td>20</td>
                </tr>
                <tr>
                  <td>Sub-county</td>
                  <td>64</td>
                </tr>
                <tr>
                  <td>Ward</td>
                  <td>300</td>
                </tr>
                <tr>
                  <td>Sub-Location</td>
                  <td>570</td>
                </tr>
                <tr>
                  <td>Community</td>
                  <td>2000</td>
                </tr>
                <tr>
                  <td>Date</td>
                  <td>12-02-2021</td>
                </tr>
                <tr>
                  <td>Monitor Name</td>
                  <td>Odhiambo Ouma</td>
                </tr>
                <tr>
                  <td>No exposed human excreta (G1-1)</td>
                  <td>7/3</td>
                </tr>
                <tr>
                  <td>Safe disposal of child excreta and diapers (G1-2)</td>
                  <td>20</td>
                </tr>
                <tr>
                  <td>
                    Presence of handwashing facility with water {"&"}
                    soap (G1-4)
                  </td>
                  <td>6/4</td>
                </tr>
                <tr>
                  <td>Handwashing facility with soap (G2-4)</td>
                  <td>6/4</td>
                </tr>
                <tr>
                  <td>Permanent Hand washing facility (G3-4)</td>
                  <td>6/2/2</td>
                </tr>
              </tbody>
            </table>
          </div>
        </TabPane>
        <TabPane tab="Raw Data" key="2">
          <Table
            loading={loading}
            dataSource={record.data}
            columns={columnsRawData}
            scroll={{ y: 300 }}
            pagination={false}
          />
        </TabPane>
      </Tabs>
      <label>Notes {"&"} Feedback</label>
      <TextArea rows={4} />
      <Row justify="space-between">
        <Col>
          <Row>
            <Checkbox id="informUser" onChange={() => {}}></Checkbox>
            <label htmlFor="informUser">Inform User of Changes</label>
          </Row>
        </Col>
        <Col>
          <Space>
            <Button className="light dev">Decline</Button>
            <Button className="primary dev" htmlType="submit">
              Approve
            </Button>
          </Space>
        </Col>
      </Row>
    </div>
  );
};

export default ApprovalDetail;
