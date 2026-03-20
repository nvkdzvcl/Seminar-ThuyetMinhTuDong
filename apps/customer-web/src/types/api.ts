export type ApiResponse<T> = {
    code: string;
    message: string;
    result: T | null;
};


export type PagingDto<T> = {
    items: T[],
    totalItems: 0,
    currentPage: 0,
    pageSize: 0,
    totalPages: 0
}