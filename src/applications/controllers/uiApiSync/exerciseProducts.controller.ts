import { APIRequestContext, APIResponse } from "@playwright/test";
import { APIBase } from "@core/base/apiBase";

/**
 * Controller for the public product catalog API on automationexercise.com.
 *
 * Unlike the Flipkart-style controllers in this repo (which target a
 * fictional backend and exist to demonstrate structure/design), this
 * controller talks to a real, live, publicly documented API and is used to
 * back the UI-API synergy demo in `tests/uiApiSync/`.
 * @see https://automationexercise.com/api_list
 * @extends APIBase
 */
export class ExerciseProductsController extends APIBase {
    private readonly PRODUCTS_LIST_ENDPOINT: string;
    private readonly SEARCH_PRODUCT_ENDPOINT: string;

    constructor(request: APIRequestContext) {
        super(request);
        // This API is a fixed public endpoint, independent of TARGET_ENV.
        this.BASE_URL = "https://automationexercise.com/api";
        this.PRODUCTS_LIST_ENDPOINT = `${this.BASE_URL}/productsList`;
        this.SEARCH_PRODUCT_ENDPOINT = `${this.BASE_URL}/searchProduct`;
    }

    /**
     * Retrieves the full product catalog.
     * @returns A promise that resolves to the API response containing all products.
     */
    async getAllProducts(): Promise<APIResponse> {
        return await this.get(this.PRODUCTS_LIST_ENDPOINT);
    }

    /**
     * Searches the product catalog by name/keyword.
     * The live API requires a form-urlencoded body (not JSON) for this endpoint.
     * @param searchTerm - The keyword to search for (e.g. "top", "tshirt", "jean").
     * @returns A promise that resolves to the API response containing matching products.
     */
    async searchProduct(searchTerm: string): Promise<APIResponse> {
        return await this.post(this.SEARCH_PRODUCT_ENDPOINT, {
            form: { search_product: searchTerm },
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
        });
    }
}
