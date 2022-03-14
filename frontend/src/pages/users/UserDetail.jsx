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
import { pick, assign } from "lodash";
import { api } from "../../lib";
import { useNotification } from "../../util/hooks";

const UserDetail = (record) => {
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
  const EditableCell = ({
    title,
    editable,
    children,
    dataIndex,
    ...restProps
  }) => {
    const [editing, setEditing] = useState(false);
    const inputRef = useRef(null);
    const form = useContext(EditableContext);
    const { notify } = useNotification();
    const [saving, setSaving] = useState(false);
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
        const body = assign(
          pick(record, [
            "first_name",
            "last_name",
            "email",
            "phone_number",
            "designation",
          ]),
          {
            role: record.role.id,
            administration: record.administration.id,
          }
        );
        const data = { ...body, [dataIndex]: values[dataIndex] };
        setSaving(true);
        api.put(`user/${record.id}`, data).then(() => {
          setSaving(false);
          toggleEdit();
          notify({
            type: "success",
            message: "User updated",
          });
        });
      } catch (errInfo) {
        console.error("Save failed:", errInfo);
        toggleEdit();
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
            <Input ref={inputRef} onPressEnter={save} />
          </Form.Item>
          <Button type="primary" loading={saving} onClick={save}>
            Save
          </Button>
          <Button onClick={toggleEdit} disabled={saving} danger>
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
      onCell: (cell) => {
        return {
          editable: col.editable,
          dataIndex: cell.key,
          title: cell.field,
        };
      },
    };
  });

  return (
    <>
      <Row justify="center" key="top">
        <Col span={20}>
          <Table
            columns={columns}
            components={components}
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
      </Row>
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
      </Row>
    </>
  );
};

export default UserDetail;
