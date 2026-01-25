import { APIRequestContext, APIResponse } from "@playwright/test";
import { APIBase } from "@core/base/apiBase";

/**
 * Controller for managing user operations via API.
 * Handles user authentication, profile management, addresses, and password operations.
 * @extends APIBase
 */
export class UserController extends APIBase {
    private readonly AUTH_ENDPOINT = `${this.BASE_URL}/auth`;
    private readonly USERS_ENDPOINT = `${this.BASE_URL}/users`;
    private readonly PROFILE_ENDPOINT = `${this.BASE_URL}/users/profile`;
    private readonly ADDRESSES_ENDPOINT = `${this.BASE_URL}/users/addresses`;

    constructor(request: APIRequestContext) {
        super(request);
    }

    /**
     * Registers a new user account with the provided information.
     * @param userData - The user registration data.
     * @param userData.email - The user's email address.
     * @param userData.password - The user's password.
     * @param userData.firstName - The user's first name.
     * @param userData.lastName - The user's last name.
     * @returns A promise that resolves to the API response containing the registration confirmation.
     */
    async register(userData: {
        email: string;
        password: string;
        firstName: string;
        lastName: string;
    }): Promise<APIResponse> {
        return await this.post(`${this.AUTH_ENDPOINT}/register`, { data: userData });
    }

    /**
     * Authenticates a user with email and password credentials.
     * @param credentials - The user login credentials.
     * @param credentials.email - The user's email address.
     * @param credentials.password - The user's password.
     * @returns A promise that resolves to the API response containing authentication tokens.
     */
    async login(credentials: { email: string; password: string }): Promise<APIResponse> {
        return await this.post(`${this.AUTH_ENDPOINT}/login`, { data: credentials });
    }

    /**
     * Logs out the current authenticated user and invalidates their session.
     * @returns A promise that resolves to the API response confirming the logout.
     */
    async logout(): Promise<APIResponse> {
        return await this.post(`${this.AUTH_ENDPOINT}/logout`, { data: {} });
    }

    /**
     * Retrieves the profile information of the current authenticated user.
     * @returns A promise that resolves to the API response containing the user profile data.
     */
    async getProfile(): Promise<APIResponse> {
        return await this.get(this.PROFILE_ENDPOINT);
    }

    /**
     * Updates the profile information of the current authenticated user.
     * @param profileData - The profile data to update.
     * @returns A promise that resolves to the API response containing the updated profile data.
     */
    async updateProfile(profileData: Record<string, unknown>): Promise<APIResponse> {
        return await this.put(this.PROFILE_ENDPOINT, { data: profileData });
    }

    /**
     * Retrieves all saved addresses for the current authenticated user.
     * @returns A promise that resolves to the API response containing the list of user addresses.
     */
    async getAddresses(): Promise<APIResponse> {
        return await this.get(this.ADDRESSES_ENDPOINT);
    }

    /**
     * Adds a new address to the current authenticated user's address book.
     * @param addressData - The address data to add.
     * @returns A promise that resolves to the API response containing the added address details.
     */
    async addAddress(addressData: Record<string, unknown>): Promise<APIResponse> {
        return await this.post(this.ADDRESSES_ENDPOINT, { data: addressData });
    }

    /**
     * Updates an existing address in the current authenticated user's address book.
     * @param addressId - The unique identifier of the address to update.
     * @param addressData - The address data to update.
     * @returns A promise that resolves to the API response containing the updated address details.
     */
    async updateAddress(addressId: string, addressData: Record<string, unknown>): Promise<APIResponse> {
        return await this.put(`${this.ADDRESSES_ENDPOINT}/${addressId}`, { data: addressData });
    }

    /**
     * Deletes an address from the current authenticated user's address book.
     * @param addressId - The unique identifier of the address to delete.
     * @returns A promise that resolves to the API response confirming the address deletion.
     */
    async deleteAddress(addressId: string): Promise<APIResponse> {
        return await this.delete(`${this.ADDRESSES_ENDPOINT}/${addressId}`);
    }

    /**
     * Changes the password for the current authenticated user.
     * @param passwordData - The password change data.
     * @param passwordData.currentPassword - The user's current password for verification.
     * @param passwordData.newPassword - The new password to set.
     * @returns A promise that resolves to the API response confirming the password change.
     */
    async changePassword(passwordData: {
        currentPassword: string;
        newPassword: string;
    }): Promise<APIResponse> {
        return await this.post(`${this.AUTH_ENDPOINT}/change-password`, { data: passwordData });
    }

    /**
     * Initiates a password reset process by sending a reset email to the specified address.
     * @param email - The email address associated with the account to reset.
     * @returns A promise that resolves to the API response confirming the reset email was sent.
     */
    async requestPasswordReset(email: string): Promise<APIResponse> {
        return await this.post(`${this.AUTH_ENDPOINT}/forgot-password`, { 
            data: { email } 
        });
    }

    /**
     * Resets the password using a reset token received via email.
     * @param resetData - The password reset data.
     * @param resetData.token - The reset token from the email.
     * @param resetData.newPassword - The new password to set.
     * @returns A promise that resolves to the API response confirming the password reset.
     */
    async resetPassword(resetData: {
        token: string;
        newPassword: string;
    }): Promise<APIResponse> {
        return await this.post(`${this.AUTH_ENDPOINT}/reset-password`, { data: resetData });
    }
}