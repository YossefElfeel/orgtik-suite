import { IEmployee } from "./employee";

export interface IDepartmentDTO {
    name: string;
    description: string;
    managerId: string;
    employeeIds: string[];
}


export interface IDepartment {
    id: string;
    name: string;
    description: string;
    managerUserId: string;
    createdAt: string;
    updatedAt: string;
    deletedAt: string | null;
    employees:{
        id:number
        jobTitle: string;
        employeeType:string
        departmentId:number
        user:{
            id:number
            username:string
            email:string
            firstName:string
            lastName:string
            avatar:string
            isActive:boolean
            userType:string
            employeeId:number
        }

    } [];
    absenteeRate: number;
    manager: {
        id: string;
        username: string;
        email: string;
        avatar: string;
    };
    stats: {
        totalEmployees: number;
        absenteeRate: number;
        budget: number;
        budgetCurrency: string;
    }
}

export interface IDepartmentSelectOption {
    id: string;
    name: string;
}



export interface IDepartmentStats {
    period: {
        from: string;
        to: string;
    };
    summary: {
        totalDepartments: number;
        newDepartments: number;
    };
    absenceByDepartment: {
        overallAbsenceRate: number;
        totalWorkingDays: number;
        totalAbsentDays: number;
        topDepartment: {
            departmentId: number;
            departmentName: string;
            employeeCount: number;
            workingDays: number;
            absentDays: number;
            absenceRate: number;
        };
        items: {
            departmentId: number;
            departmentName: string;
            employeeCount: number;
            workingDays: number;
            absentDays: number;
            absenceRate: number;
        }[];
    };
    mostEmployees: {
        totalEmployees: number;
        topDepartment: {
            departmentId: number;
            departmentName: string;
            employeeCount: number;
            employeeShare: number;
        };
        items: {
            departmentId: number;
            departmentName: string;
            employeeCount: number;
            employeeShare: number;
        }[];
    };
}