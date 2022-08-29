import React from "react";
import { Tour } from "../../../components";
import { store, config } from "../../../lib";

const AddUserTour = () => {
  const { user: authUser } = store.useState((s) => s);

  const steps = [
    ...(config.checkAccess(authUser?.role_detail, "user")
      ? [
          {
            image: "/assets/tour/add-user/add-user.png",
            title: "Add a new user",
            description:
              "A user can fill this form and click on the SUBMIT button to post their new user.",
          },
        ]
      : []),
  ];

  return <Tour steps={steps} title="Adding a new user" />;
};

export default React.memo(AddUserTour);
