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
            description: "Search data with select dropdowns.",
          },
          {
            image: "/assets/tour/manage-data/6.png",
            title: "Add",
            description: "This is an add-data button.",
          },
          {
            image: "/assets/tour/manage-data/3.png",
            title: "Exports",
            description: "This is an export-data button.",
          },
          {
            image: "/assets/tour/manage-data/4.png",
            title: "Uploads",
            description: "This is an upload-data button.",
          },
          {
            image: "/assets/tour/manage-data/5.png",
            title: "View data on the table",
            description: "This is a table where you can see the data",
          },
        ]
      : []),
  ];

  return <Tour steps={steps} title="Manage data" />;
};

export default React.memo(ManageDataTour);
