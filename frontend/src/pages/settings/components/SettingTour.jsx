import React from "react";
import { Tour } from "../../../components";
import { store, config } from "../../../lib";

const SettingTour = () => {
  const { user: authUser } = store.useState((s) => s);

  const steps = [
    ...(config.checkAccess(authUser?.role_detail, "data")
      ? [
          {
            image: "/assets/tour/settings/1.png",
            title: "Heading",
            description:
              "Lorem ipsum dolor sit, amet consectetur adipisicing elit",
          },
          {
            image: "/assets/tour/settings/2.png",
            title: "Manage organization",
            description:
              "Lorem ipsum dolor sit, amet consectetur adipisicing elit",
          },
        ]
      : []),
  ];

  return <Tour steps={steps} title="Settings" />;
};

export default React.memo(SettingTour);
