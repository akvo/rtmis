import React from "react";
import { Tour } from "../../../components";
import { store, config } from "../../../lib";

const ProfileTour = () => {
  const { user: authUser } = store.useState((s) => s);

  const steps = [
    {
      image: "/assets/tour/profile/1.png",
      title: "Control Center",
      description: "Lorem ipsum dolor sit, amet consectetur adipisicing elit",
    },
    ...(config.checkAccess(authUser?.role_detail, "form")
      ? [
          {
            image: "/assets/tour/profile/2.png",
            title: "Data Uploads",
            description:
              "Velit amet omnis dolores. Ad eveniet ex beatae dolorum",
          },
        ]
      : []),
    ...(config.checkAccess(authUser?.role_detail, "approvals")
      ? [
          {
            image: "/assets/tour/profile/3.png",
            title: "Manage Approvals",
            description: "Placeat impedit iure quaerat neque sit quasi",
          },
          {
            image: "/assets/tour/profile/4.png",
            title: "Manage Approvers",
            description: "Magni provident aliquam harum cupiditate iste",
          },
        ]
      : []),
  ];

  return <Tour steps={steps} title="Profile" />;
};

export default React.memo(ProfileTour);
