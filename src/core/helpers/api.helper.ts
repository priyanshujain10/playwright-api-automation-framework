export const APPLICATION_JSON = "application/json";

/**
 * Generates default headers for API requests.
 * @param token - The optional authentication token to include in the Authorization header.
 * @returns An object containing the default headers: Accept, Content-Type, and optionally Authorization and x-api-key.
 */
export const getDefaultHeaders = (token: string | undefined) => ({
    "Accept": APPLICATION_JSON,
    "Content-Type": APPLICATION_JSON,
    ...(token ? { "Authorization": `Bearer ${token}` } : {}),
    ...(process.env.API_KEY ? { "x-api-key": process.env.API_KEY } : {}),
});

/**
 * Generates headers for multipart API requests.
 * @param token - The optional authentication token to include in the Authorization header.
 * @returns An object containing the headers: Accept, and optionally Authorization.
 */
export const getMultipartHeaders = (token: string | undefined) => ({
    "Accept": APPLICATION_JSON,
    ...(token ? { "Authorization": `Bearer ${token}` } : {}),
});