import React from "react";
import { Tour } from "../../../components";
import { store, config } from "../../../lib";

const AddUserTour = () => {
  const { user: authUser } = store.useState((s) => s);

  const steps = [
    ...(config.checkAccess(authUser?.role_detail, "user")
      ? [
          {
            image: "/assets/tour/add-user/1.png",
            title: "Form for a new User",
            description: "This shows a form to add a new user.",
          },
        ]
      : []),
  ];

  return <Tour steps={steps} title="Adding a new user" />;
};

export default React.memo(AddUserTour);
