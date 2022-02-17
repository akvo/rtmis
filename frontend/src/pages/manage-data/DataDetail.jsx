import { Row, Col, Table, Button, Divider } from "antd";

const DataDetail = ({ questionGroups, record }) => {
  const { answer } = record;
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
  const dataset = questionGroups
    .map((qg, qgi) => {
      const question = qg.question.map((q) => {
        return {
          key: `question-${q.id}`,
          field: q.name,
          value: answer?.find((r) => r.question === q.id)?.value,
        };
      });
      return [
        {
          key: `question-group-${qgi}`,
          field: qg.name,
          render: (value) => <h1>{value}</h1>,
        },
        ...question,
      ];
    })
    .flatMap((x) => x);
  return (
    <Row justify="center">
      <Col span={20}>
        <Table
          columns={columns}
          dataSource={dataset}
          pagination={false}
          scroll={{ y: 300 }}
        />
      </Col>
      <Divider />
      <Col span={10} align="left">
        <Button className="light">Delete</Button>
      </Col>
      <Col span={10} align="right">
        <Button className="light">Upload CSV</Button>
      </Col>
    </Row>
  );
};

export default DataDetail;
