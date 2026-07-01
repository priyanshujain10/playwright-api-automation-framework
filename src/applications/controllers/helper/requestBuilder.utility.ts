export interface Filter {
    field: string;
    operator: string;
    value: unknown;
}

export interface Sort {
    field: string;
    direction: 'asc' | 'desc';
}

export interface Pagination {
    page: number;
    pageSize: number;
}

/**
 * Utility class for building request bodies and query parameters.
 */
export class RequestBuilderUtility {
    
    /**
     * Builds a request body object with optional filters, sort, and pagination.
     * @param filters - Array of filter objects.
     * @param sort - Array of sort objects.
     * @param pagination - Pagination object.
     * @returns The constructed request body.
     */
    static buildRequestBody(
        filters?: Filter[],
        sort?: Sort[],
        pagination?: Pagination
    ): Record<string, unknown> {
        const requestBody: Record<string, unknown> = {};

        if (filters && filters.length > 0) {
            requestBody.filters = filters;
        }

        if (sort && sort.length > 0) {
            requestBody.sort = sort;
        }

        if (pagination) {
            requestBody.pagination = pagination;
        }

        return requestBody;
    }

    /**
     * Builds query parameters string from a params object.
     * @param params - Object containing key-value pairs for query params.
     * @returns The query string.
     */
    static buildQueryParams(params: Record<string, unknown>): string {
        const queryParams = new URLSearchParams();
        
        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                queryParams.append(key, String(value));
            }
        });

        return queryParams.toString();
    }
}