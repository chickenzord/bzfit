// Generic response wrappers - exported as TypeScript types only
// since Zod doesn't support generics the same way

export type ApiResponseDto<T = any> = {
  data: T;
  message?: string;
};

export type PaginatedResponseDto<T = any> = {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};
