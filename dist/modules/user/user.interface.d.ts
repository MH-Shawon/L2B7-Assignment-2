declare enum Role {
    contributor = "contributor",
    maintainer = "maintainer"
}
export interface IUser {
    name: string;
    email: string;
    password: string;
    role: Role;
}
export {};
//# sourceMappingURL=user.interface.d.ts.map