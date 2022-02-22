import React, { useEffect, useMemo, useState } from "react";
import { Row, Col, Select, message } from "antd";
import { api, store } from "../../lib";
import "./style.scss";
import { SteppedLineTo } from "react-lineto";

const { Option } = Select;
const users = [
  {
    id: 1,
    name: "A. Awiti",
  },
  {
    id: 2,
    name: "Kerubo Stacy",
  },
  {
    id: 3,
    name: "Kimeli. K",
  },
  {
    id: 4,
    name: "Kipsang Kipchoge",
  },
  {
    id: 5,
    name: "Maina Mwangi",
  },
];

const TreeRenderer = ({ nodes }) => {
  const { administration, selectedForm } = store.useState((state) => state);
  const [adminNodes, setAdminNodes] = useState([]);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    const adminClone = administration.map((adminNode) => ({
      ...adminNode,
      user: null,
      active: false,
      children: [...adminNode.children].map((aN) => ({ ...aN, active: false })),
    }));
    for (let i = 0; i < adminClone.length - 1; i++) {
      const pos = adminClone[i].children.findIndex(
        (c) => c.name === adminClone[i + 1].name
      );
      if (pos !== -1) {
        adminClone[i].children[pos].active = true;
      }
    }
    setAdminNodes(adminClone);
  }, [administration]);
  const userMenu = useMemo(() => {
    return (
      <Select value={1}>
        {users.map((user, userIndex) => (
          <Option key={userIndex} value={user.id}>
            {user.name}
          </Option>
        ))}
      </Select>
    );
  }, []);

  const handleClick = (e, index) => {
    if (!e) {
      return;
    }
    setLoading(true);
    api
      .get(`administration/${e}/`)
      .then((res) => {
        store.update((s) => {
          s.administration.length = index + 1;
          s.administration = [
            ...s.administration,
            {
              id: res.data.id,
              name: res.data.name,
              levelName: res.data.level_name,
              children: res.data.children,
            },
          ];
        });
        setLoading(false);
      })
      .catch((err) => {
        message.error("Could not load filters");
        setLoading(false);
        console.error(err);
      });
  };

  const renderNodes = useMemo(() => {
    return (
      <Row>
        {nodes.map((nodeItem, i) => (
          <Col
            key={i}
            style={{
              padding: "10px 20px",
              margin: "10px 40px 10px 20px",
            }}
          >
            {nodeItem.children.map((childItem, j) => (
              <div
                className={`tree-block tree-form-block-${childItem.id}
                  ${childItem.id === selectedForm ? "active" : ""}`}
                key={j}
                onClick={() => {
                  // TODO
                }}
              >
                {childItem.name}
              </div>
            ))}
          </Col>
        ))}

        {adminNodes.map((adminItem, k) => (
          <Col
            key={k}
            style={{
              padding: "10px 20px",
              margin: "10px 40px 10px 20px",
            }}
          >
            {adminItem.children.map((childItem, l) => (
              <div
                className={`tree-block tree-block-${k}-${childItem.id}
                  ${childItem.active ? "active" : ""}`}
                key={l}
                onClick={() => {
                  if (!loading) {
                    handleClick(childItem.id, k);
                  }
                }}
              >
                <div>{childItem.name}</div>
                {userMenu}
              </div>
            ))}
          </Col>
        ))}

        {adminNodes.map((adminItem, m) => (
          <div key={m}>
            {m < 1 ? (
              <div>
                {adminItem.children.map((childItem) => {
                  return (
                    <SteppedLineTo
                      within="tree-wrap"
                      key={`tree-line-${childItem.id}`}
                      from={`tree-form-block-${selectedForm}`}
                      to={`tree-block-0-${childItem.id}`}
                      fromAnchor="right"
                      toAnchor="left"
                      delay={0}
                      borderColor="#707070"
                      orientation="h"
                      borderStyle="dashed"
                    />
                  );
                })}
              </div>
            ) : (
              <div>
                {adminItem.children.map((childItem) => {
                  return (
                    <SteppedLineTo
                      within="tree-wrap"
                      key={`tree-line-${childItem.id}`}
                      from={`tree-block-${m - 1}-${childItem.parent}`}
                      to={`tree-block-${m}-${childItem.id}`}
                      fromAnchor="right"
                      toAnchor="left"
                      delay={0}
                      borderColor="#707070"
                      orientation="h"
                      borderStyle="dashed"
                    />
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </Row>
    );
  }, [nodes, adminNodes, selectedForm, loading, userMenu]);

  return (
    <div
      className="tree-wrap"
      id="tree-wrap"
      style={{
        position: "relative",
        height: "80vh",
        width: "100%",
        overflow: "scroll",
      }}
    >
      <div>{renderNodes}</div>
    </div>
  );
};

export default React.memo(TreeRenderer);
