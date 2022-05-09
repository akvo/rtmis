class UserRoleTypes:
    super_admin = 1
    admin = 2
    approver = 3
    user = 4
    read_only = 5

    FieldStr = {
        super_admin: 'Super Admin',
        admin: 'Admin',
        approver: 'Approver',
        user: 'Data Entry Staff',
        read_only: 'Institutional User'
    }
