import { APIRequestContext, APIResponse } from '@playwright/test';
import { getDefaultHeaders } from '../helpers/api.helper';
import { DeleteOptions, GetOptions, PostOptions, PutOptions } from '../models/userDefinedTypes';
import { logger } from "../utils/loggingUtil/logger";
import { WritableController } from './controllerRoles.interfaces';

/**
 * Base class for API interactions using Playwright's APIRequestContext.
 * Provides common HTTP methods (GET, POST, PUT, PATCH, DELETE) with automatic header handling and logging.
 *
 * Liskov Substitution Principle (LSP): every controller (ProductController,
 * CartController, OrderController, ...) extends APIBase without narrowing
 * parameter types or widening return types, so any controller can stand in
 * anywhere an APIBase/WritableController is expected (see controller.fixture.ts).
 */
export class APIBase implements WritableController {
    protected request: APIRequestContext;
    protected BASE_URL = `${process.env.API_BASE_URL}${process.env.API_VERSION}`;
    
    private readonly SENSITIVE_HEADERS = ['authorization', 'cookie', 'x-api-key', 'x-auth-token', 'api-key'];

    /**
     * Creates an instance of APIBase.
     * @param request - The Playwright APIRequestContext to use for making HTTP requests.
     */
    constructor(request: APIRequestContext) {
        this.request = request;
    }

    /**
     * Masks sensitive header values for secure logging purposes.
     * Replaces values of sensitive headers (like authorization tokens) with '***'.
     * @param headers - The headers object to mask.
     * @returns A new headers object with sensitive values masked.
     */
    private maskSensitiveHeaders(headers: Record<string, unknown>): Record<string, unknown> {
        const maskedHeaders: Record<string, unknown> = {};
        
        for (const [key, value] of Object.entries(headers)) {
            const lowerKey = key.toLowerCase();
            maskedHeaders[key] = this.SENSITIVE_HEADERS.includes(lowerKey) && value ? '***' : value;
        }
        
        return maskedHeaders;
    }

    /**
     * Prepares request options by merging default headers and creating a safe version for logging.
     * Merges default headers (including authentication) with provided options and masks sensitive headers.
     * @param options - Optional request options that may include custom headers.
     * @returns An object containing 'merged' (full options for the request) and 'safe' (masked options for logging).
     */
    private prepareOptions(options?: { headers?: Record<string, unknown> }): { merged: Record<string, unknown>, safe: Record<string, unknown> } {
        const headers = { ...getDefaultHeaders(process.env.API_TOKEN), ...(options?.headers || {}) };
        const merged = { ...options, headers };
        const safe = {
            ...options,
            headers: this.maskSensitiveHeaders(headers)
        };
        return { merged, safe };
    }

    /**
     * Performs a GET request to the specified URL.
     * Automatically includes default headers and logs the request with masked sensitive information.
     * @param url - The URL to send the GET request to.
     * @param options - Optional request options as defined by GetOptions.
     * @returns A Promise that resolves to the APIResponse from Playwright.
     */
    async get(url: string, options?: GetOptions): Promise<APIResponse> {
        const { merged, safe } = this.prepareOptions(options);
        logger.info(`GET ${url}`, { options: safe });
        return await this.request.get(url, merged);
    }

    /**
     * Performs a POST request to the specified URL.
     * Automatically includes default headers and logs the request with masked sensitive information.
     * @param url - The URL to send the POST request to.
     * @param options - Optional request options as defined by PostOptions.
     * @returns A Promise that resolves to the APIResponse from Playwright.
     */
    async post(url: string, options?: PostOptions): Promise<APIResponse> {
        const { merged, safe } = this.prepareOptions(options);
        logger.info(`POST ${url}`, { options: safe });
        return await this.request.post(url, { ...merged });
    }

    /**
     * Performs a PUT request to the specified URL.
     * Automatically includes default headers and logs the request with masked sensitive information.
     * @param url - The URL to send the PUT request to.
     * @param options - Optional request options as defined by PutOptions.
     * @returns A Promise that resolves to the APIResponse from Playwright.
     */
    async put(url: string, options?: PutOptions): Promise<APIResponse> {
        const { merged, safe } = this.prepareOptions(options);
        logger.info(`PUT ${url}`, { options: safe });
        return await this.request.put(url, { ...merged });
    }

    /**
     * Performs a PATCH request to the specified URL.
     * Automatically includes default headers and logs the request with masked sensitive information.
     * @param url - The URL to send the PATCH request to.
     * @param options - Optional request options as defined by PutOptions.
     * @returns A Promise that resolves to the APIResponse from Playwright.
     */
    async patch(url: string, options?: PutOptions): Promise<APIResponse> {
        const { merged, safe } = this.prepareOptions(options);
        logger.info(`PATCH ${url}`, { options: safe });
        return await this.request.patch(url, { ...merged });
    }

    /**
     * Performs a DELETE request to the specified URL.
     * Automatically includes default headers and logs the request with masked sensitive information.
     * @param url - The URL to send the DELETE request to.
     * @param options - Optional request options as defined by DeleteOptions.
     * @returns A Promise that resolves to the APIResponse from Playwright.
     */
    async delete(url: string, options?: DeleteOptions): Promise<APIResponse> {
        const { merged, safe } = this.prepareOptions(options);
        logger.info(`DELETE ${url}`, { options: safe });
        return await this.request.delete(url, { ...merged });
    }
}