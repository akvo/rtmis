import React, { useCallback, useEffect, useState } from "react";
import { Layout, Menu } from "antd";
const { Sider } = Layout;
import { store, config } from "../../lib";
import { useNavigate } from "react-router-dom";
import {
  UserOutlined,
  TableOutlined,
  DatabaseOutlined,
  DashboardOutlined,
  DownloadOutlined,
} from "@ant-design/icons";

const Sidebar = () => {
  const { user: authUser } = store.useState((s) => s);
  const [selectedKey, setSelectedKey] = useState("");
  const [openKeys, setOpenKeys] = useState([]);
  const navigate = useNavigate();

  const { roles } = config;
  const superAdminRole = roles.find((r) => r.id === authUser?.role_detail?.id);

  const pageAccessToLabelAndUrlMapping = {
    user: { label: "Manage Platform Users", url: "/control-center/users" },
    approvers: {
      label: "Validation Tree",
      url: "/control-center/approvers/tree",
    },
    mobile: {
      label: "Manage Mobile Users",
      url: "/control-center/mobile-assignment",
    },
    data: [{ label: "Manage Data", url: "/control-center/data/manage" }],
    "master-data": [
      { label: "Administrative List", url: "/control-center/master-data" },
      { label: "Attributes", url: "/control-center/master-data/attributes" },
      { label: "Entities", url: "/control-center/master-data/entities" },
      {
        label: "Entity Types",
        url: "/control-center/master-data/entity-types",
      },
      {
        label: "Organisations",
        url: "/control-center/master-data/organisations",
      },
    ],
  };

  const controlCenterToLabelMapping = {
    "control-center": {
      label: "Control Center",
      icon: DashboardOutlined,
    },
    "manage-user": {
      label: "Users",
      icon: UserOutlined,
      childrenKeys: ["user", "approvers", "mobile"],
    },
    "manage-data": {
      label: "Data",
      icon: TableOutlined,
      childrenKeys: ["data"],
    },
    "manage-master-data": {
      label: "Master Data",
      icon: DatabaseOutlined,
      childrenKeys: ["master-data"],
    },
    download: {
      label: "Downloads",
      icon: DownloadOutlined,
    },
  };

  const determineChildren = (key) => {
    const mapping = pageAccessToLabelAndUrlMapping[key];
    if (Array.isArray(mapping)) {
      return mapping.map((item, index) => ({
        key: key + "_" + index,
        ...item,
      }));
    }
    return [{ key, ...mapping }];
  };

  const createMenuItems = (controlCenterOrder, pageAccess) => {
    const menuItems = [];
    const controlCenterItem = controlCenterToLabelMapping["control-center"];
    const downloadItem = controlCenterToLabelMapping["download"];
    if (controlCenterItem) {
      menuItems.push({
        key: "control-center",
        icon: controlCenterItem.icon
          ? React.createElement(controlCenterItem.icon)
          : null,
        label: controlCenterItem.label,
        url: "/control-center",
      });
    }
    Object.keys(controlCenterToLabelMapping).forEach((orderKey) => {
      if (orderKey === "control-center" || orderKey === "download") {
        return;
      }

      const item = controlCenterToLabelMapping[orderKey];
      if (!item) {
        return;
      }

      const { label, icon, childrenKeys } = item;

      const shouldIncludeItem =
        controlCenterOrder.includes(orderKey) ||
        childrenKeys.some((childKey) => pageAccess.includes(childKey));

      if (shouldIncludeItem) {
        const children = childrenKeys
          .filter((key) => pageAccess.includes(key.split(/(\d+)/)[0]))
          .flatMap((key) => determineChildren(key, pageAccess));

        menuItems.push({
          key: orderKey,
          icon: icon ? React.createElement(icon) : null,
          label,
          children: children.length ? children : null,
        });
      }
    });
    if (downloadItem) {
      menuItems.push({
        key: "download",
        icon: downloadItem.icon ? React.createElement(downloadItem.icon) : null,
        label: downloadItem.label,
        url: "/downloads",
      });
    }

    return menuItems;
  };

  const usersMenuItem = createMenuItems(
    superAdminRole.control_center_order,
    superAdminRole.page_access
  );

  const findUrlByKey = (items, key) => {
    for (const item of items) {
      if (item.key === key) {
        return item.url;
      }
      if (item.children) {
        const url = findUrlByKey(item.children, key);
        if (url) {
          return url;
        }
      }
    }
  };

  const handleMenuClick = ({ key }) => {
    const url = findUrlByKey(usersMenuItem, key);
    navigate(url);
  };

  const findKeyByUrl = useCallback((items, url) => {
    for (const item of items) {
      if (item.url === url) {
        return item.key;
      }
      if (item.children) {
        const key = findKeyByUrl(item.children, url);
        if (key) {
          return key;
        }
      }
    }
  }, []);

  useEffect(() => {
    const currentKey = findKeyByUrl(usersMenuItem, location.pathname);
    if (currentKey !== selectedKey || openKeys.length === 0) {
      setSelectedKey(currentKey);
      const newOpenKeys = [];
      for (const menu of usersMenuItem) {
        if (menu.url && menu.key === currentKey) {
          newOpenKeys.push(menu.key);
          break;
        }
        if (menu.children) {
          const item = menu.children.find((child) => child.key === currentKey);
          if (item) {
            newOpenKeys.push(menu.key);
            break;
          }
        }
      }
      if (JSON.stringify(openKeys) !== JSON.stringify(newOpenKeys)) {
        setOpenKeys(newOpenKeys);
      }
    }
  }, [usersMenuItem, selectedKey, openKeys, findKeyByUrl]);

  return (
    <Sider className="site-layout-background">
      <Menu
        mode="inline"
        selectedKeys={[selectedKey]}
        openKeys={openKeys}
        style={{
          height: "100%",
          borderRight: 0,
        }}
        onSelect={handleMenuClick}
        onOpenChange={(newOpenKeys) => setOpenKeys(newOpenKeys)}
        items={usersMenuItem}
      />
    </Sider>
  );
};

export default Sidebar;
