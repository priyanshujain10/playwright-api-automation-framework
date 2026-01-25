import { APIRequestContext, APIResponse } from "@playwright/test";
import { APIBase } from "@core/base/apiBase";
import { RequestBuilderUtility } from "../controllers/helper/requestBuilder.utitlity";

/**
 * Controller for managing product operations via API.
 * Provides methods for retrieving, creating, updating, and searching products,
 * as well as managing categories and filters.
 * @extends APIBase
 */
export class ProductController extends APIBase {
    private readonly PRODUCTS_ENDPOINT = `${this.BASE_URL}/products`;
    private readonly PRODUCT_BY_ID_ENDPOINT = `${this.BASE_URL}/products`;
    private readonly PRODUCT_SEARCH_ENDPOINT = `${this.BASE_URL}/products/search`;
    private readonly PRODUCT_CATEGORIES_ENDPOINT = `${this.BASE_URL}/products/categories`;
    private readonly PRODUCT_FILTERS_ENDPOINT = `${this.BASE_URL}/products/filters`;

    constructor(request: APIRequestContext) {
        super(request);
    }

    /**
     * Retrieves a paginated list of all products with optional sorting.
     * @param params - Optional query parameters for pagination and sorting.
     * @param params.page - The page number for pagination.
     * @param params.pageSize - The number of products per page.
     * @param params.sort - The sorting criteria (e.g., 'price_asc', 'name_desc').
     * @returns A promise that resolves to the API response containing the list of products.
     */
    async getAllProducts(params?: { page?: number; pageSize?: number; sort?: string }): Promise<APIResponse> {
        const queryString = params ? `?${RequestBuilderUtility.buildQueryParams(params)}` : '';
        return await this.get(`${this.PRODUCTS_ENDPOINT}${queryString}`);
    }

    /**
     * Retrieves detailed information for a specific product by its ID.
     * @param productId - The unique identifier of the product.
     * @returns A promise that resolves to the API response containing the product details.
     */
    async getProductById(productId: string): Promise<APIResponse> {
        return await this.get(`${this.PRODUCT_BY_ID_ENDPOINT}/${productId}`);
    }

    /**
     * Creates a new product in the catalog. Requires admin privileges.
     * @param productData - The product data to create.
     * @returns A promise that resolves to the API response containing the created product details.
     */
    async createProduct(productData: Record<string, unknown>): Promise<APIResponse> {
        return await this.post(this.PRODUCTS_ENDPOINT, { data: productData });
    }

    /**
     * Updates an existing product's information with full replacement.
     * @param productId - The unique identifier of the product to update.
     * @param productData - The complete product data to update.
     * @returns A promise that resolves to the API response containing the updated product details.
     */
    async updateProduct(productId: string, productData: Record<string, unknown>): Promise<APIResponse> {
        return await this.put(`${this.PRODUCT_BY_ID_ENDPOINT}/${productId}`, { data: productData });
    }

    /**
     * Partially updates an existing product's information.
     * @param productId - The unique identifier of the product to update.
     * @param productData - The partial product data to update.
     * @returns A promise that resolves to the API response containing the updated product details.
     */
    async patchProduct(productId: string, productData: Record<string, unknown>): Promise<APIResponse> {
        return await this.patch(`${this.PRODUCT_BY_ID_ENDPOINT}/${productId}`, { data: productData });
    }

    /**
     * Deletes a product from the catalog.
     * @param productId - The unique identifier of the product to delete.
     * @returns A promise that resolves to the API response confirming the product deletion.
     */
    async deleteProduct(productId: string): Promise<APIResponse> {
        return await this.delete(`${this.PRODUCT_BY_ID_ENDPOINT}/${productId}`);
    }

    /**
     * Searches for products based on various criteria including text query, category, price range, and attributes.
     * @param searchParams - The search parameters.
     * @param searchParams.query - Text query to search in product names and descriptions.
     * @param searchParams.category - Filter by product category.
     * @param searchParams.minPrice - Minimum price filter.
     * @param searchParams.maxPrice - Maximum price filter.
     * @param searchParams.size - Filter by product size.
     * @param searchParams.color - Filter by product color.
     * @param searchParams.inStock - Filter for products that are in stock.
     * @returns A promise that resolves to the API response containing the search results.
     */
    async searchProducts(searchParams: { 
        query?: string; 
        category?: string; 
        minPrice?: number; 
        maxPrice?: number;
        size?: string;
        color?: string;
        inStock?: boolean;
    }): Promise<APIResponse> {
        const queryString = RequestBuilderUtility.buildQueryParams(searchParams);
        return await this.get(`${this.PRODUCT_SEARCH_ENDPOINT}?${queryString}`);
    }

    /**
     * Retrieves all available product categories.
     * @returns A promise that resolves to the API response containing the list of categories.
     */
    async getCategories(): Promise<APIResponse> {
        return await this.get(this.PRODUCT_CATEGORIES_ENDPOINT);
    }

    /**
     * Retrieves available filters for products, optionally filtered by category.
     * @param category - Optional category to get filters for a specific category.
     * @returns A promise that resolves to the API response containing available filter options.
     */
    async getFilters(category?: string): Promise<APIResponse> {
        const queryString = category ? `?category=${category}` : '';
        return await this.get(`${this.PRODUCT_FILTERS_ENDPOINT}${queryString}`);
    }

    /**
     * Retrieves products belonging to a specific category with optional pagination.
     * @param category - The category to filter products by.
     * @param params - Optional pagination parameters.
     * @param params.page - The page number for pagination.
     * @param params.pageSize - The number of products per page.
     * @returns A promise that resolves to the API response containing products in the specified category.
     */
    async getProductsByCategory(category: string, params?: { page?: number; pageSize?: number }): Promise<APIResponse> {
        const queryString = params ? `&${RequestBuilderUtility.buildQueryParams(params)}` : '';
        return await this.get(`${this.PRODUCTS_ENDPOINT}?category=${category}${queryString}`);
    }
}