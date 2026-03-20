export type User = {
    id: 0,
    fullName: string,
    phoneNumber: string,
    email: string,
    language: string,
    role: string,
    createdAt: string,
    status: string
};

export type LoginPayload = {
    email: string;
    password: string;
};

export type LoginResponse = {
    accessToken: string;
    refreshToken?: string;
    user: User;
};

export type LogoutResquest = {
    refreshToken: string;
};


export type RegisterPayload = {
    fullName: string;
    phoneNumber: string;
    email: string;
    password: string;
    language: string;
};


export type RegisterResponse = {
    isRegistered: boolean;
};


