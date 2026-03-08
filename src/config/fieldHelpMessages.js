const fieldHelpMessages = {
    userRole: "User Role defines the permission level and access rights of the user in the system.",
    department: "Department helps categorize users under organizational units.",
    orgRole: "Org Role determines approval/processing authority for workflows.",
    amountLimit: "This will serve as the basis for approving incoming expense forms. This has bearing to approvers only. If a user is part of an approval workflow, his assigned org Role amount limit will determine if incoming expenses will be for his approval or not",
    isDefaultApprover: "Org Roles that are set to Default Approver will be the ones to be the default org role approvers when creating department. Take note that the default approvers on creating department can be modified.",
};
  
  export default fieldHelpMessages;
  