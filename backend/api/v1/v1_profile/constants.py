class UserRoleTypes:
    super_admin = 1
    admin = 2
    approver = 3
    user = 4
    read_only = 5

    FieldStr = {
        super_admin: 'Super Admin',
        admin: 'County Admin',
        approver: 'Data Approver',
        user: 'Data Entry Staff',
        read_only: 'Institutional User'
    }


class UserDesignationTypes:
    nse = 1
    cse = 2
    ppho = 3
    pho = 4
    cpho = 5
    cwash = 6
    cha = 7
    chew = 9
    me = 9
    it = 10
    sa = 11

    FieldStr = {
        nse: "NSE (National Sanitation Extender)",
        cse: "CSE (County Sanitation Extender)",
        ppho: "PPHO (Principal Public Health Officer)",
        pho: "PHO (Public Health Officer)",
        cpho: "CPHO (County Public Health Officer)",
        cwash: "CWASH (County WASH Officer)",
        cha: "CHA (Community Health Assistant)",
        chew: "CHEW (Community Helath Extension Worker)",
        me: "M&E",
        it: "IT",
        sa: "System Admin",
    }
