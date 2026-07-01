import { APIResponse } from "@playwright/test";
import { DeleteOptions, GetOptions, PostOptions, PutOptions } from "@core/models/userDefinedTypes";

/**
 * Interface Segregation Principle (ISP):
 * Read-only consumers (e.g. a reporting adapter that only ever fetches
 * data to attach to a report) should depend on this narrow contract
 * instead of the full read/write surface of APIBase.
 */
export interface ReadableController {
    get(url: string, options?: GetOptions): Promise<APIResponse>;
}

/**
 * Mutating consumers depend on this contract instead of APIBase directly,
 * so a future read-only test double can implement ReadableController alone
 * without being forced to stub post/put/patch/delete.
 */
export interface WritableController extends ReadableController {
    post(url: string, options?: PostOptions): Promise<APIResponse>;
    put(url: string, options?: PutOptions): Promise<APIResponse>;
    patch(url: string, options?: PutOptions): Promise<APIResponse>;
    delete(url: string, options?: DeleteOptions): Promise<APIResponse>;
}
