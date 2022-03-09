import React, { useEffect, useRef, useState, useContext } from "react";
import {
  Row,
  Col,
  Table,
  Button,
  Checkbox,
  Space,
  Divider,
  Form,
  Input,
} from "antd";
import { Link } from "react-router-dom";

const EditableContext = React.createContext(null);
const EditableRow = ({ ...props }) => {
  const [form] = Form.useForm();
  return (
    <Form form={form} component={false}>
      <EditableContext.Provider value={form}>
        <tr {...props} />
      </EditableContext.Provider>
    </Form>
  );
};

const UserDetail = (record) => {
  const EditableCell = ({
    title,
    editable,
    children,
    dataIndex,
    record,
    handleSave,
    ...restProps
  }) => {
    const [editing, setEditing] = useState(false);
    const inputRef = useRef(null);
    const form = useContext(EditableContext);
    useEffect(() => {
      if (editing) {
        inputRef.current.focus();
      }
    }, [editing]);

    const toggleEdit = () => {
      setEditing(!editing);
      form.setFieldsValue({
        [dataIndex]: record[dataIndex],
      });
    };

    const save = async () => {
      try {
        const values = await form.validateFields();
        toggleEdit();
        handleSave({ ...record, ...values });
      } catch (errInfo) {
        console.error("Save failed:", errInfo);
      }
    };

    let childNode = children;
    if (editable) {
      childNode = editing ? (
        <Space>
          <Form.Item
            style={{
              margin: 0,
            }}
            name={dataIndex}
            rules={[
              {
                required: true,
                message: `${title} is required.`,
              },
            ]}
          >
            <Input
              className="dev"
              ref={inputRef}
              onPressEnter={save}
              disabled
            />
          </Form.Item>
          <Button className="dev" onClick={save} disabled>
            Save
          </Button>
          <Button onClick={toggleEdit} danger>
            Cancel
          </Button>
        </Space>
      ) : (
        <div
          className="editable-cell-value-wrap"
          style={{
            paddingRight: 24,
          }}
          onClick={() => {
            toggleEdit();
          }}
        >
          {children}
        </div>
      );
    }

    return <td {...restProps}>{childNode}</td>;
  };

  const handleSave = () => {};

  const columnData = [
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
      editable: true,
    },
  ];
  const components = {
    body: {
      row: EditableRow,
      cell: EditableCell,
    },
  };

  const columns = columnData.map((col) => {
    if (!col.editable) {
      return col;
    }

    return {
      ...col,
      onCell: (record) => {
        record.editable = col.editable;
        return {
          record,
          editable: col.editable,
          dataIndex: col.dataIndex,
          title: col.title,
          handleSave: handleSave,
        };
      },
    };
  });

  return [
    <Row justify="center" key="top">
      <Col span={20}>
        <Table
          columns={columns}
          components={components}
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
            {
              key: "designation",
              field: "Designation",
              value: `${record?.designation || "-"}`,
            },
            {
              key: "phone_number",
              field: "Phone Number",
              value: `${record?.phone_number || "-"}`,
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
          <Button className="light dev">Edit</Button>
          <Button danger>Delete</Button>
        </Space>
      </Col>
    </Row>,
  ];
};

export default UserDetail;
