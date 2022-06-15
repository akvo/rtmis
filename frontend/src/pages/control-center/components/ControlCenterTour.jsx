import React from "react";
import { Tour } from "../../../components";
import { store, config } from "../../../lib";

const ControlCenterTour = () => {
  const { user: authUser } = store.useState((s) => s);

  const steps = [
    ...(config.checkAccess(authUser?.role_detail, "data")
      ? [
          {
            image: "/assets/tour/control-center/1.png",
            title: "Manage Data",
            description:
              "Lorem ipsum dolor sit, amet consectetur adipisicing elit",
          },
          {
            image: "/assets/tour/control-center/2.png",
            title: "Exports",
            description:
              "Velit amet omnis dolores. Ad eveniet ex beatae dolorum",
          },
        ]
      : []),
    ...(authUser?.role_id !== 4 &&
    config.checkAccess(authUser?.role_detail, "form")
      ? [
          {
            image: "/assets/tour/control-center/3.png",
            title: "Data Uploads",
            description: "Placeat impedit iure quaerat neque sit quasi",
          },
        ]
      : []),
    ...(config.checkAccess(authUser?.role_detail, "user")
      ? [
          {
            image: "/assets/tour/control-center/4.png",
            title: "User Management",
            description: "Magni provident aliquam harum cupiditate iste",
          },
        ]
      : []),
    ...(authUser?.role_id === 4 ||
    config.checkAccess(authUser?.role_detail, "form")
      ? [
          {
            image: "/assets/tour/control-center/5.png",
            title: "Data Uploads Panel",
            description:
              "Velit amet omnis dolores. Ad eveniet ex beatae dolorum",
          },
        ]
      : []),
    ...(config.checkAccess(authUser?.role_detail, "approvals")
      ? [
          {
            image: "/assets/tour/control-center/6.png",
            title: "Manage Approvals",
            description: "Placeat impedit iure quaerat neque sit quasi",
          },
          {
            image: "/assets/tour/control-center/7.png",
            title: "Manage Approvers",
            description: "Magni provident aliquam harum cupiditate iste",
          },
        ]
      : []),
  ];

  return <Tour steps={steps} />;
};

export default React.memo(ControlCenterTour);
