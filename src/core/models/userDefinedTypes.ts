import { APIRequestContext, Page } from "@playwright/test";

export type GotoOptions = Parameters<Page['goto']>[1];
export type GetOptions = Parameters<APIRequestContext['get']>[1];
export type PostOptions = Parameters<APIRequestContext['post']>[1];
export type PutOptions = Parameters<APIRequestContext['put']>[1];
export type DeleteOptions = Parameters<APIRequestContext['delete']>[1];
export type PatchOptions = Parameters<APIRequestContext['patch']>[1];