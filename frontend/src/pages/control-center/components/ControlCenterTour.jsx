import React, { useMemo } from "react";
import { Tour } from "../../../components";
import { store, config, uiText } from "../../../lib";

const ControlCenterTour = () => {
  const { user: authUser } = store.useState((s) => s);
  const { language } = store.useState((s) => s);
  const { active: activeLang } = language;
  const text = useMemo(() => {
    return uiText[activeLang];
  }, [activeLang]);

  const steps = [
    ...(config.checkAccess(authUser?.role_detail, "data")
      ? [
          {
            image: "/assets/tour/control-center/1.png",
            title: "Manage Routine Data",
            description: text.tourManageData,
          },
          {
            image: "/assets/tour/control-center/2.png",
            title: "Exports",
            description: text.tourExports,
          },
        ]
      : []),
    ...(authUser?.role_id !== 4 &&
    config.checkAccess(authUser?.role_detail, "form")
      ? [
          {
            image: "/assets/tour/control-center/3.png",
            title: "Data Uploads",
            description: text.tourDataUploads,
          },
        ]
      : []),
    ...(config.checkAccess(authUser?.role_detail, "user")
      ? [
          {
            image: "/assets/tour/control-center/4.png",
            title: "User Management",
            description: text.tourUserManagement,
          },
        ]
      : []),
    ...(authUser?.role_id === 4 ||
    config.checkAccess(authUser?.role_detail, "form")
      ? [
          {
            image: "/assets/tour/control-center/5.png",
            title: "Data Uploads Panel",
            description: text.tourDataUploadsPanel,
          },
        ]
      : []),
    ...(config.checkAccess(authUser?.role_detail, "approvals")
      ? [
          {
            image: "/assets/tour/control-center/6.png",
            title: "Manage Approvals",
            description: text.tourApprovals,
          },
          {
            image: "/assets/tour/control-center/7.png",
            title: "Manage Approvers",
            description: text.tourApprovers,
          },
        ]
      : []),
  ];

  return <Tour steps={steps} />;
};

export default React.memo(ControlCenterTour);
