import React from "react";
import { Tour } from "../../../components";
import { store, config } from "../../../lib";

const ManageDataTour = () => {
  const { user: authUser } = store.useState((s) => s);
  const steps = [
    ...(config.checkAccess(authUser?.role_detail, "data")
      ? [
          {
            image: "/assets/tour/manage-data/manage-data.png",
            title: "Manage data heading",
            description:
              "Lorem ipsum dolor sit, amet consectetur adipisicing elit",
          },
          {
            image: "/assets/tour/manage-data/filtering.png",
            title: "Searching data",
            description:
              "Velit amet omnis dolores. Ad eveniet ex beatae dolorum",
          },
          {
            image: "/assets/tour/manage-data/add-data.png",
            title: "Exports",
            description:
              "Velit amet omnis dolores. Ad eveniet ex beatae dolorum",
          },
          {
            image: "/assets/tour/manage-data/2.png",
            title: "Exports",
            description:
              "Velit amet omnis dolores. Ad eveniet ex beatae dolorum",
          },
          {
            image: "/assets/tour/manage-data/bulk-upload.png",
            title: "Uploads",
            description:
              "Velit amet omnis dolores. Ad eveniet ex beatae dolorum",
          },
          {
            image: "/assets/tour/manage-data/table-view.png",
            title: "View data on the table",
            description:
              "Velit amet omnis dolores. Ad eveniet ex beatae dolorum",
          },
        ]
      : []),
  ];

  return <Tour steps={steps} />;
};

export default React.memo(ManageDataTour);
