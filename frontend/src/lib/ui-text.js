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
    footerAboutTitle: "About Data",
    footerAboutDescription:
      "All the data contained in the RUSH platform is aggregated from both primary and secondary data sources from the 47 counties in Kenya. The data is updated on a monthly basis.",
    footerContactTitle: "Contacts",
    footerContactAddress:
      "Afya House, Cathedral Road, P.O. Box:30016–00100, Nairobi, Kenya",
    footerContactPhone: "+254-20-2717077",
    footerContactEmail: "ps@health.go.ke",
    footerContactFeedback: {
      text: "Feedback Form",
      url: "https://docs.google.com/forms/d/e/1FAIpQLSf5rjD66CCcMWYgFwkNp8Xb1lRJoec1CwhhPnjOd-mU84ktPA/viewform",
    },
    footerExternalLinkTitle: "External Links",
    footerExternalLinkItems: [
      {
        text: "Data Capture Tool (DCT)",
        url: "https://khro-dct.health.go.ke/",
      },
      { text: "mygov Website", url: "http://mygov.go.ke/" },
      { text: "Presidency", url: "http://presidency.go.ke/" },
      { text: "eCitizen Kenya", url: "http://ecitizen.go.ke/" },
      { text: "Huduma Center Kenya", url: "http://hudumakenya.go.ke/" },
    ],
    footerAgenciesTitle: "Agencies",
    footerAgenciesItems: [
      {
        text: "Inauguration of the National Advisory Committee",
        url: "https://www.health.go.ke/inauguration-of-the-national-advisory-committee/",
      },
      {
        text: "Press Releases",
        url: "https://www.health.go.ke/press-releases/",
      },
      { text: "KEMRI", url: "https://kemri.org/" },
      { text: "KEMSA", url: "https://kemsa.co.ke/" },
    ],
    footerQuickLinkTitle: "Quick Links",
    footerQuickLinkItems: [
      {
        text: "JMP",
        url: "https://washdata.org/how-we-work/about-jmp#:~:text=Background,hygiene%20(WASH)%20since%201990",
      },
      {
        text: "CLTS",
        url: "https://www.communityledtotalsanitation.org/country/kenya",
      },
      {
        text: "GLASS",
        url: "https://www.who.int/teams/environment-climate-change-and-health/water-sanitation-and-health/monitoring-and-evidence/wash-systems-monitoring/un-water-global-analysis-and-assessment-of-sanitation-and-drinking-water",
      },
    ],
    copyright: "Privacy Policy / Terms of Use / © 2022 — Ministry of Health",
    // Header Links
    controlCenter: "Control Center",
    myProfile: "My Profile",
    settings: "System Settings",
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
    manageDataTitle: "Manage Data",
    manageDataButton: "Manage Data",
    manageDataText: (
      <Fragment>
        This is where you :
        <ul>
          <li>Add new data using webforms</li>
          <li>Bulk upload data using spreadsheets</li>
          <li>Download data</li>
        </ul>
      </Fragment>
    ),
    dataDownloadTitle: "Data Download",
    dataDownloadButton: "Download Data",
    dataDownloadText: (
      <Fragment>
        This is where you :
        <ul>
          <li>Access downloaded data</li>
        </ul>
      </Fragment>
    ),
    dataUploadTitle: "Data Upload",
    dataUploadButton: "Data Upload",
    dataUploadText: (
      <Fragment>
        This is where you :
        <ul>
          <li>Download upload template</li>
          <li>Bulk upload new data</li>
          <li>Bulk upload existing data</li>
        </ul>
      </Fragment>
    ),
    manageUserTitle: "User Management",
    manageUserButton: "Manage Users",
    manageUserText: (
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
    settingsDescriptionPanel:
      "This page allow Super Admin to maintain system critical master lists.",
    // Approvals
    approvalsTab1: "My Pending",
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
    formDescription: (
      <p>
        Please fill up the webform below with relevant responses. You will need
        to answer all mandatory questions before you can submit.
        <br />
        Once you have sumitted a webform, please do not forget to add it as part
        of a batch and send it for approval.
      </p>
    ),
    formSuccessTitle: "Thank you for the submission",
    formSuccessSubTitle:
      "Do note that this data has NOT been sent for approval. If you are ready to send the submissions for approval, please create a batch and send to the approver",
    formSuccessSubTitleForAdmin:
      "Do note that the data submitted by SUPER ADMIN role will not go through the approval flow and recorded as approved data",
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
    dataExportSuccess: "Data downloaded successfully",
    dataExportFail: "Data download failed",
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
    deleteOrganisationDesc: ({ count = 0 }) => (
      <span>
        There are <b>{count} Users</b> associated with this organisation. Please
        reassign or delete these user(s) before deleting the organisation to
        prevent unexpected results
      </span>
    ),
    deleteOrganisationTitle: "You are about to delete the organization",
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
    // Add user modal notification
    existingApproverTitle: "There are existing approvers for:",
    existingApproverDescription:
      "Please update the setup in manage validation tree or remove these forms for the current user",
  },

  de: {},
};

export default uiText;
