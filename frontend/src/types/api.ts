export type ApiResponse<T> = {
    code: string;
    message: string;
    result: T | null;
};

export type PagingDto<T> = {
    items: T[];
    totalItems: number;
    currentPage: number;
    pageSize: number;
    totalPages: number;
};