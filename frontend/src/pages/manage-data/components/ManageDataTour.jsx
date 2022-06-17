import React from "react";
import { Tour } from "../../../components";
import { store, config } from "../../../lib";

const ManageDataTour = () => {
  const { user: authUser } = store.useState((s) => s);
  const steps = [
    ...(config.checkAccess(authUser?.role_detail, "data")
      ? [
          {
            image: "/assets/tour/manage-data/1.png",
            title: "Manage data heading",
            description:
              "Lorem ipsum dolor sit, amet consectetur adipisicing elit",
          },
          {
            image: "/assets/tour/manage-data/2.png",
            title: "Searching data",
            description:
              "Velit amet omnis dolores. Ad eveniet ex beatae dolorum",
          },
          {
            image: "/assets/tour/manage-data/3.png",
            title: "Exports",
            description:
              "Velit amet omnis dolores. Ad eveniet ex beatae dolorum",
          },
          {
            image: "/assets/tour/manage-data/4.png",
            title: "Uploads",
            description:
              "Velit amet omnis dolores. Ad eveniet ex beatae dolorum",
          },
          {
            image: "/assets/tour/manage-data/5.png",
            title: "View data on the table",
            description:
              "Velit amet omnis dolores. Ad eveniet ex beatae dolorum",
          },
          {
            image: "/assets/tour/manage-data/6.png",
            title: "Add",
            description:
              "Velit amet omnis dolores. Ad eveniet ex beatae dolorum",
          },
        ]
      : []),
  ];

  return <Tour steps={steps} />;
};

export default React.memo(ManageDataTour);
