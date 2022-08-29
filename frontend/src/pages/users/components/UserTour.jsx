import React from "react";
import { Tour } from "../../../components";
import { store, config } from "../../../lib";

const UserTour = () => {
  const { user: authUser } = store.useState((s) => s);

  const steps = [
    ...(config.checkAccess(authUser?.role_detail, "data")
      ? [
          {
            image: "/assets/tour/manage-user/3.png",
            title: "Search users",
            description: "Search user by name, country, organization and role",
          },
          {
            image: "/assets/tour/manage-user/4.png",
            title: "Add user",
            description:
              "A user can add a new user by clicking on this button which redirect to add-user page",
          },
        ]
      : []),
  ];

  return <Tour steps={steps} title="Users" />;
};

export default React.memo(UserTour);
