import type { IIssue } from "../../types";
type Query = {
    sort?: string;
    type?: string;
    status?: string;
};
export declare const issueService: {
    postIssueIntoDB: (payload: {
        title: string;
        description: string;
        type: string;
        id: number;
    }) => Promise<any>;
    getAllIssuesFromDB: (query: Query) => Promise<any>;
    getSingleIssueFromDB: (id: string) => Promise<{
        id: any;
        title: any;
        description: any;
        type: any;
        status: any;
        reporter: any;
        created_at: any;
        updated_at: any;
    } | null>;
    deleteIssueFromDB: (id: string) => Promise<any>;
    updateIssueInDB: (payload: IIssue, id: string, loginUser: {
        role: string;
        userId: string;
    }) => Promise<any>;
};
export {};
//# sourceMappingURL=issue.service.d.ts.map