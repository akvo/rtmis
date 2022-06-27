import React, { Fragment } from "react";

const uiText = {
  en: {
    // Home page
    welcome: (
      <Fragment>
        Welcome to the Rural Urban
        <br />
        Sanitation and Hygiene (RUSH)
        <br />
        Monitoring Platform
      </Fragment>
    ),
    welcomeDesc: "Updated sanitation and hygiene estimates across Kenya",
    countdownTitle: "Time remaining to achieve national RUSH targets:",
    year: "Year",
    month: "Month",
    day: "Day",
    hour: "Hour",
    minute: "Minute",
    second: "Second",
    welcomeCta: "Explore the Data",
    // Error messages
    error: "Error",
    errorPageNA: "Oops this page is not available",
    errorAuth: "You are not authorised to access this page",
    errorUnknown: "An unknown error occurred",
    errorURL:
      "Please check the URL again or let us take you back to the RUSH homepage",
    errorVerifyCreds:
      "Please verify your credentials for the requested resource",
    backHome: "Back to Homepage",
    errorDataLoad: "Could not load data",
    errorUserLoad: "Failed to load user data",
    errorFileList: "Could not fetch File list",
    errorSomething: "Something went wrong",
    errorMandatoryFields: "Please answer all the mandatory questions",
    // Footer
    footer1Title: "About Data",
    footer1Text:
      "The data contained in the RUSH platform is aggregated from both primary and secondary data sources. The data is updated on monthly basis.",
    footer2Title: "Contact",
    footer3Title: "Quick Links",
    footer2Text1: "Phone",
    footer2Val1: "xxxxxxxxxx",
    footer2Text2: "Email",
    footer2Val2: "xxx@gmail.com",
    footer3Text1: "JMP",
    footer3Link1:
      "https://washdata.org/how-we-work/about-jmp#:~:text=Background,hygiene%20(WASH)%20since%201990",
    footer3Text2: "CLTS",
    footer3Link2: "https://www.communityledtotalsanitation.org/country/kenya",
    footer3Text3: "GLASS",
    footer3Link3:
      "https://www.who.int/teams/environment-climate-change-and-health/water-sanitation-and-health/monitoring-and-evidence/wash-systems-monitoring/un-water-global-analysis-and-assessment-of-sanitation-and-drinking-water",
    copyright: "Copyright 2021",
    // Header Links
    controlCenter: "Control Center",
    myProfile: "My Profile",
    settings: "Settings",
    signOut: "Sign Out",
    dashboards: "Dashboards",
    reports: "Reports",
    newsEvents: "News & Events",
    login: "Log in",
    // Placeholder text
    lorem:
      "Lorem ipsum dolor sit amet consectetur adipisicing elit. Possimus, assumenda quos? Quia deleniti sapiente aut! Ab consequatur cumque fugit ea. Dolore ex rerum quisquam inventore eum dicta doloribus harum cum.",
    lorem2: "Lorem ipsum dolor sit amet consectetur adipisicing elit.",
    // Charts
    showEmpty: "Show empty values",
    // User Management
    manageUsers: "Manage Users",
    addUser: "Add User",
    editUser: "Edit User",
    updateUser: "Update User",
    // Organisation Management
    manageOrganisations: "Manage Organizations",
    addOrganisation: "Add Organization",
    editOrganisation: "Edit Organization",
    updateOrganisation: "Update Organization",
    // Validations
    valFirstName: "First name is required",
    valLastName: "Last name is required",
    valEmail: "Please enter a valid Email Address",
    valPhone: "Phone number is required",
    valDesignation: "Please select a Designation",
    valRole: "Please select a Role",
    valOrganization: "Please select an Organization",
    valOrgName: "Organization name is required",
    valOrgAttributes: "Please select an Attributes",
    // Control Center
    ccPane1Title: "Manage Data",
    ccPane1Button: "Manage Data",
    ccPane1Text: (
      <Fragment>
        This is where you :
        <ul>
          <li>Add new data using webforms</li>
          <li>Bulk upload data using spreadsheets</li>
          <li>Export data</li>
        </ul>
      </Fragment>
    ),
    ccPane2Title: "Exports",
    ccPane2Button: "Data Exports",
    ccPane2Text: (
      <Fragment>
        This is where you :
        <ul>
          <li>Access exported data</li>
        </ul>
      </Fragment>
    ),
    ccPane3Title: "Data Uploads",
    ccPane3Button: "Data Uploads",
    ccPane3Text: (
      <Fragment>
        This is where you :
        <ul>
          <li>Download upload template</li>
          <li>Bulk upload new data</li>
          <li>Bulk upload existing data</li>
        </ul>
      </Fragment>
    ),
    ccPane4Title: "User Management",
    ccPane4Button: "Manage Users",
    ccPane4Text: (
      <Fragment>
        This where you manage users based on their roles , regions and
        questionnaire access . You can :
        <ul>
          <li>Add new user</li>
          <li>Modify existing user</li>
          <li>Delete existing user</li>
        </ul>
      </Fragment>
    ),
    ccDescriptionPanel:
      "Instant access to the all the administration pages and overview panels for data approvals.",
    // Settings
    orgPanelTitle: "Manage Organization",
    orgPanelButton: "Manage Organization",
    orgPanelText: (
      <Fragment>
        This is where you :
        <ul>
          <li>Add new organization</li>
          <li>Modify existing organization</li>
          <li>Delete existing organization</li>
        </ul>
      </Fragment>
    ),
    settingsDescriptionPanel: "This is description about settings.",
    // Approvals
    approvalsTab1: "My Pending Approvals",
    approvalsTab2: "Subordinates Approvals",
    approvalsTab3: "Approved",
    manageQnApproval: "Manage Questionnaire Approval",
    // Approvers Tree
    notAssigned: "Not assigned",
    // Misc
    informUser: "Inform User of Changes",
    // Data Uploads
    batchSelectedDatasets: "Batch Selected Datasets",
    batchDatasets: "Batch Datasets",
    uploadsTab1: "Pending Submission",
    uploadsTab2: "Pending Approval",
    uploadsTab3: "Approved",
    batchName: "Batch Name",
    submissionComment: "Submission comment (Optional)",
    sendNewRequest: "Send a new approval request",
    createNewBatch: "Create a new batch",
    batchHintText: "You are about to create a Batch CSV File",
    batchHintDesc:
      "The operation of merging datasets cannot be undone, and will Create a new batch that will require approval from you admin",
    // Upload Detail
    uploadTab1: "Data Summary",
    uploadTab2: "Raw Data",
    notesFeedback: "Notes & Feedback",
    // Export Data
    generating: "Generating",
    failed: "Failed",
    download: "Download",
    // Webform
    fetchingForm: "Fetching form..",
    // Forgot Password
    forgotTitle: "Reset your password",
    forgotDesc:
      "Enter the email associated with your account and we&apos;ll Send an email with instructions to reset your password",
    instructionsMailed: "Instructions mailed successfully",
    sendInstructions: "Send Instructions",
    // Reset Password
    welcomeShort: "Welcome to RUSH",
    resetHint: (
      <Fragment>
        Please set your password for the platform.
        <br />
        Your password must include:
      </Fragment>
    ),
    invalidInviteTitle: "Invalid Invite Code",
    invalidInviteDesc:
      "Lorem, ipsum dolor sit amet consectetur adipisicing elit. Autem provident voluptatum cum numquam, quidem vitae, qui quam beatae exercitationem ullam perferendis! Nobis in aut fuga voluptate harum, tempore distinctio optio.",
    // Register
    passwordRule1: "Lowercase Character",
    passwordRule2: "Numbers",
    passwordRule3: "Special Character ( -._!`'#%&,:;<>=@{}~$()*+/?[]^|] )",
    passwordRule4: "Uppercase Character",
    passwordRule5: "No White Space",
    passwordRule6: "Minimum 8 Characters",
    passwordUpdateSuccess: "Password updated successfully",
    passwordRequired: "Please input your Password!",
    passwordCriteriaError: "False Password Criteria",
    passwordMatchError: "The two passwords that you entered do not match!",
    accountDisclaimer:
      "The user is accountable for his/her account and in case there are any changes (Transfers, retirement, any kind of leave, resignation etc) this should be communicated to the County Administrator or National Super Admin who might be able to assign the roles to the new officer.",
    // Log in
    loginTitle: (
      <Fragment>
        Welcome back
        <br />
        <small>Please enter your account details</small>
      </Fragment>
    ),
    contactAdmin: "Please contact the administrator",
    formAssignmentError:
      "You don't have any form assignment, please contact the administrator",
    usernameRequired: "Please input your Username!",
    // Approvals Panel
    panelApprovalsDesc: (
      <Fragment>
        This is where you :
        <ul>
          <li>View pending data approvals awaiting your approval </li>
          <li>View pending approvals by your subordinate approvers</li>
          <li>Assign subordinate approvers</li>
        </ul>
      </Fragment>
    ),
    // Upload Data
    dataExportSuccess: "Data exported successfully",
    dataExportFail: "Data export failed",
    fileUploadSuccess: "File uploaded successfully",
    fileUploadFail: "Could not upload file",
    templateFetchFail: "Could not fetch template",
    updateExisting: "Update Existing Data",
    templateDownloadHint:
      "If you do not already have a template please download it",
    uploading: "Uploading..",
    dropFile: "Drop your file here",
    selectForm: "Please select a form",
    browseComputer: "Browse your computer",
    usersLoadFail: "Could not load users",
    userDeleteFail: "Could not delete user",
    deleteUserHint:
      "Deleting this user will not delete the data association(s)",
    deleteUserTitle: "You are about to delete the user",
    deleteUserDesc:
      "The User will no longer be able to access the RUSH platform as an Enumrator/Admin etc",
    userAssociations: "This user has following data association(s)",
    organisationsLoadFail: "Could not load organizations",
    organisationDeleteFail: "Could not delete organization",
    deleteOrganisationHint:
      "Deleting this organization will not delete the user(s)",
    deleteOrganisationTitle: "You are about to delete the organization",
    deleteOrganisationDesc:
      "The Organisation will no longer be able to access the RUSH platform",
    // Tour
    prev: "Prev",
    next: "Next",
    finish: "Finish",
    tourControlCenter:
      "Lorem ipsum dolor sit, amet consectetur adipisicing elit",
    tourDataUploads: "Velit amet omnis dolores. Ad eveniet ex beatae dolorum",
    tourApprovals: "Placeat impedit iure quaerat neque sit quasi",
    tourApprovers: "Magni provident aliquam harum cupiditate iste",
    tourManageData: "Lorem ipsum dolor sit, amet consectetur adipisicing elit",
    tourExports: "Velit amet omnis dolores. Ad eveniet ex beatae dolorum",
    tourUserManagement: "Magni provident aliquam harum cupiditate iste",
    tourDataUploadsPanel:
      "Velit amet omnis dolores. Ad eveniet ex beatae dolorum",
  },

  de: {},
};

export default uiText;
