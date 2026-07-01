import { test, expect } from "@applications/controllers/helper/controller.fixture";
import { ExpectUtil } from "@core/utils/expectUtil";
import { logger } from "@core/utils/loggingUtil/logger";
import userSchema from "@testdata/json/expectedSchemas/userSchema.json";

// ─── CRUD: User Profile ───────────────────────────────────────────────────────

test.describe('User API — Profile CRUD', {
    tag: ['@User', '@Profile', '@CRUD', '@API']
}, () => {

    // ─── CREATE (Register) ──────────────────────────────────────────────────
    test('[POST] Register — valid new user returns 201', {
        tag: ['@Smoke', '@Register', '@Create']
    }, async ({ userController }) => {
        logger.info('Test: Register a new user with valid credentials');

        const uniqueEmail = `qa.user+${Date.now()}@flipkart-test.com`;
        const response = await userController.register({
            email: uniqueEmail,
            password: 'SecurePass@123',
            firstName: 'Rahul',
            lastName: 'Sharma'
        });
        const body = await response.json();

        logger.info(`Register status: ${response.status()}`);
        expect(response.status(), 'Registration should return 201').toBe(201);
        expect(body.success).toBe(true);
        expect(body.data.email).toBe(uniqueEmail);
        expect(body.data.firstName).toBe('Rahul');
        // Password must never be returned in the response body
        expect(body.data).not.toHaveProperty('password');
        logger.info(`Registered user id=${body.data.id}`);
    });

    test('[POST] Register — duplicate email returns 409 Conflict', {
        tag: ['@Negative', '@Register']
    }, async ({ userController }) => {
        logger.info('Test: Register with an already-used email');

        const response = await userController.register({
            email: 'existing.user@flipkart-test.com',
            password: 'SecurePass@123',
            firstName: 'Priya',
            lastName: 'Nair'
        });
        const body = await response.json();

        logger.info(`Duplicate register status: ${response.status()}`);
        expect(response.status()).toBe(409);
        expect(body.success).toBe(false);
        expect(body.error.message).toMatch(/exist|duplicate|already/i);
    });

    test('[POST] Register — missing required fields returns 400', {
        tag: ['@Negative', '@Register']
    }, async ({ userController }) => {
        logger.info('Test: Register with missing required fields');

        const response = await userController.register({
            email: '',
            password: '',
            firstName: '',
            lastName: ''
        });
        const body = await response.json();

        expect(response.status()).toBe(400);
        expect(body.success).toBe(false);
        expect(body.error.message).toBeTruthy();
    });

    // ─── READ (Get Profile) ─────────────────────────────────────────────────
    test('[GET] Get profile — authenticated user returns 200 with contract', {
        tag: ['@Smoke', '@GetProfile', '@Read', '@SchemaValidation']
    }, async ({ userController }) => {
        logger.info('Test: Get authenticated user profile');

        const response = await userController.getProfile();
        const body = await response.json();

        logger.info(`Get profile status: ${response.status()}`);
        expect(response.status()).toBe(200);
        expect(body.success).toBe(true);

        // Contract / schema validation
        ExpectUtil.expectToMatchSchema(
            body.data,
            userSchema,
            'User profile response should match schema'
        );

        // Field-level assertions
        expect(body.data.email).toBeTruthy();
        expect(body.data.firstName).toBeTruthy();
        expect(body.data.id).toBeTruthy();
        logger.info(`Profile retrieved for userId=${body.data.id}`);
    });

    test('[GET] Get profile — unauthenticated request returns 401', {
        tag: ['@Negative', '@Authorization', '@GetProfile']
    }, async ({ userController }) => {
        logger.info('Test: Get profile without authentication — expect 401');

        // Override the token for this request only by passing an empty Authorization header
        const response = await userController['request'].get(
            `${userController['BASE_URL']}/users/profile`,
            { headers: { Authorization: '' } }
        );

        logger.info(`Unauthenticated profile status: ${response.status()}`);
        expect(response.status()).toBeGreaterThanOrEqual(401);
    });

    // ─── UPDATE (Put Profile) ───────────────────────────────────────────────
    test('[PUT] Update profile — valid data returns 200', {
        tag: ['@Smoke', '@UpdateProfile', '@Update']
    }, async ({ userController }) => {
        logger.info('Test: Update user profile with valid data');

        const updatedData = {
            firstName: 'Vikram',
            lastName: 'Mehta',
            phone: '+91-98765-11111'
        };

        const response = await userController.updateProfile(updatedData);
        const body = await response.json();

        logger.info(`Update profile status: ${response.status()}`);
        expect(response.status()).toBe(200);
        expect(body.success).toBe(true);
        expect(body.data.firstName).toBe(updatedData.firstName);
        expect(body.data.lastName).toBe(updatedData.lastName);
    });

    test('[PUT] Update profile — invalid email format returns 400', {
        tag: ['@Negative', '@UpdateProfile']
    }, async ({ userController }) => {
        logger.info('Test: Update profile with malformed email');

        const response = await userController.updateProfile({
            email: 'not-an-email-address'
        });
        const body = await response.json();

        expect(response.status()).toBe(400);
        expect(body.success).toBe(false);
        expect(body.error.message).toMatch(/email|invalid|format/i);
    });
});

// ─── CRUD: Addresses ─────────────────────────────────────────────────────────

test.describe('User API — Address CRUD', {
    tag: ['@User', '@Address', '@CRUD', '@API']
}, () => {

    const newAddress = {
        firstName: 'Priya',
        lastName: 'Nair',
        addressLine1: 'B-204, Raheja Residency',
        city: 'Bengaluru',
        state: 'Karnataka',
        zipCode: '560038',
        country: 'IN',
        phone: '+91-98765-43210'
    };

    // ─── CREATE ─────────────────────────────────────────────────────────────
    test('[POST] Add address — valid data returns 201', {
        tag: ['@Smoke', '@AddAddress', '@Create']
    }, async ({ userController }) => {
        logger.info('Test: Add a new address for the authenticated user');

        const response = await userController.addAddress(newAddress);
        const body = await response.json();

        logger.info(`Add address status: ${response.status()}`);
        expect(response.status()).toBe(201);
        expect(body.success).toBe(true);
        expect(body.data.addressId).toBeTruthy();
        expect(body.data.city).toBe(newAddress.city);
        expect(body.data.zipCode).toBe(newAddress.zipCode);
    });

    test('[POST] Add address — missing required field returns 400', {
        tag: ['@Negative', '@AddAddress']
    }, async ({ userController }) => {
        logger.info('Test: Add address with missing zipCode');

        const incompleteAddress = {
            firstName: 'John',
            lastName: 'Doe',
            addressLine1: '456 Elm Street',
            city: 'New York',
            state: 'NY',
            country: 'US'
            // zipCode intentionally omitted
        };

        const response = await userController.addAddress(incompleteAddress);
        const body = await response.json();

        expect(response.status()).toBe(400);
        expect(body.success).toBe(false);
        expect(body.error.message).toMatch(/pin|zip|required|field/i);
    });

    // ─── READ ────────────────────────────────────────────────────────────────
    test('[GET] Get addresses — returns list with correct structure', {
        tag: ['@Smoke', '@GetAddresses', '@Read']
    }, async ({ userController }) => {
        logger.info('Test: Get all addresses for authenticated user');

        const response = await userController.getAddresses();
        const body = await response.json();

        logger.info(`Get addresses status: ${response.status()}`);
        expect(response.status()).toBe(200);
        expect(body.success).toBe(true);
        expect(Array.isArray(body.data)).toBe(true);

        // Each address should have required fields
        for (const address of body.data) {
            expect(address.addressId).toBeTruthy();
            expect(address.addressLine1).toBeTruthy();
            expect(address.city).toBeTruthy();
            expect(address.zipCode).toBeTruthy();
        }
    });

    // ─── UPDATE ──────────────────────────────────────────────────────────────
    test('[PUT] Update address — valid update returns 200', {
        tag: ['@Smoke', '@UpdateAddress', '@Update']
    }, async ({ userController }) => {
        logger.info('Test: Update an existing address');

        // First, create an address to update
        const addResponse = await userController.addAddress(newAddress);
        const addBody = await addResponse.json();
        const addressId = addBody.data.addressId;
        logger.info(`Created addressId=${addressId} for update test`);

        const updatedAddress = { ...newAddress, city: 'Mumbai', state: 'Maharashtra', zipCode: '400001' };
        const response = await userController.updateAddress(addressId, updatedAddress);
        const body = await response.json();

        logger.info(`Update address status: ${response.status()}`);
        expect(response.status()).toBe(200);
        expect(body.success).toBe(true);
        expect(body.data.city).toBe('Mumbai');
        expect(body.data.zipCode).toBe('400001');
    });

    test('[PUT] Update non-existent address returns 404', {
        tag: ['@Negative', '@UpdateAddress']
    }, async ({ userController }) => {
        logger.info('Test: Update address with a non-existent ID');

        const response = await userController.updateAddress('ADDR-DOES-NOT-EXIST-99999', newAddress);
        const body = await response.json();

        expect(response.status()).toBe(404);
        expect(body.success).toBe(false);
        expect(body.error.message).toMatch(/not found|address/i);
    });

    // ─── DELETE ──────────────────────────────────────────────────────────────
    test('[DELETE] Delete address — existing address returns 200', {
        tag: ['@Smoke', '@DeleteAddress', '@Delete']
    }, async ({ userController }) => {
        logger.info('Test: Delete an existing address');

        // Create address first
        const addResponse = await userController.addAddress(newAddress);
        const addBody = await addResponse.json();
        const addressId = addBody.data.addressId;
        logger.info(`Created addressId=${addressId} for delete test`);

        const response = await userController.deleteAddress(addressId);
        const body = await response.json();

        logger.info(`Delete address status: ${response.status()}`);
        expect(response.status()).toBe(200);
        expect(body.success).toBe(true);

        // Verify address is gone — subsequent GET should not contain it
        const listResponse = await userController.getAddresses();
        const listBody = await listResponse.json();
        const deleted = listBody.data.find((a: { addressId: string }) => a.addressId === addressId);
        expect(deleted).toBeUndefined();
        logger.info(`Address ${addressId} confirmed deleted ✓`);
    });

    test('[DELETE] Delete non-existent address returns 404', {
        tag: ['@Negative', '@DeleteAddress']
    }, async ({ userController }) => {
        logger.info('Test: Delete address with a non-existent ID');

        const response = await userController.deleteAddress('ADDR-DOES-NOT-EXIST-99999');
        const body = await response.json();

        expect(response.status()).toBe(404);
        expect(body.success).toBe(false);
        expect(body.error.message).toMatch(/not found|address/i);
    });
});

// ─── Authentication ───────────────────────────────────────────────────────────

test.describe('User API — Authentication', {
    tag: ['@User', '@Auth', '@Authentication', '@API']
}, () => {

    test('[POST] Login — valid credentials returns 200 with token', {
        tag: ['@Smoke', '@Login']
    }, async ({ userController }) => {
        logger.info('Test: Login with valid credentials');

        const response = await userController.login({
            email: process.env.USERNAME ?? 'qa.user@flipkart-test.com',
            password: process.env.PASSWORD ?? 'password123'
        });
        const body = await response.json();

        logger.info(`Login status: ${response.status()}`);
        expect(response.status()).toBe(200);
        expect(body.success).toBe(true);
        expect(body.data.accessToken).toBeTruthy();
        expect(body.data.accessToken.length).toBeGreaterThan(20);
        logger.info('Login access token received ✓');
    });

    test('[POST] Login — wrong password returns 401', {
        tag: ['@Negative', '@Login', '@Authorization']
    }, async ({ userController }) => {
        logger.info('Test: Login with wrong password');

        const response = await userController.login({
            email: process.env.USERNAME ?? 'qa.user@flipkart-test.com',
            password: 'WrongPassword!!!'
        });
        const body = await response.json();

        logger.info(`Wrong-password login status: ${response.status()}`);
        expect(response.status()).toBe(401);
        expect(body.success).toBe(false);
        expect(body.error.message).toMatch(/invalid|credentials|password|unauthorized/i);
    });

    test('[POST] Login — non-existent user returns 401', {
        tag: ['@Negative', '@Login']
    }, async ({ userController }) => {
        logger.info('Test: Login with non-existent email');

        const response = await userController.login({
            email: 'nobody-exists@nowhere.invalid',
            password: 'AnyPassword123!'
        });
        const body = await response.json();

        expect(response.status()).toBe(401);
        expect(body.success).toBe(false);
        // Should NOT reveal whether the email exists (security: user enumeration)
        expect(body.error.message).toMatch(/invalid|credentials|unauthorized/i);
        expect(body.error.message).not.toMatch(/email not found|no account/i);
    });

    test('[POST] Login — missing email field returns 400', {
        tag: ['@Negative', '@Login']
    }, async ({ userController }) => {
        logger.info('Test: Login with missing email field');

        const response = await userController.login({
            email: '',
            password: 'SomePassword123!'
        });
        const body = await response.json();

        expect(response.status()).toBe(400);
        expect(body.success).toBe(false);
    });

    test('[POST] Logout — authenticated user returns 200', {
        tag: ['@Smoke', '@Logout']
    }, async ({ userController }) => {
        logger.info('Test: Logout authenticated user');

        const response = await userController.logout();
        const body = await response.json();

        logger.info(`Logout status: ${response.status()}`);
        expect(response.status()).toBe(200);
        expect(body.success).toBe(true);
    });

    test('[POST] Logout — accessing profile after logout returns 401', {
        tag: ['@Regression', '@Logout', '@Authorization']
    }, async ({ userController }) => {
        logger.info('Test: Profile should be inaccessible after logout');

        // Logout first
        const logoutResponse = await userController.logout();
        expect(logoutResponse.status()).toBe(200);

        // Attempt to access protected resource
        const profileResponse = await userController.getProfile();
        logger.info(`Post-logout profile access status: ${profileResponse.status()}`);
        expect(
            profileResponse.status(),
            'Protected resource must return 401/403 after logout'
        ).toBeGreaterThanOrEqual(401);
    });
});

// ─── Password Management ─────────────────────────────────────────────────────

test.describe('User API — Password Management', {
    tag: ['@User', '@Password', '@API']
}, () => {

    test('[POST] Request password reset — valid email returns 200', {
        tag: ['@Smoke', '@ForgotPassword']
    }, async ({ userController }) => {
        logger.info('Test: Request password reset with valid email');

        const response = await userController.requestPasswordReset('test@example.com');
        const body = await response.json();

        logger.info(`Password reset request status: ${response.status()}`);
        expect(response.status()).toBe(200);
        expect(body.success).toBe(true);
        // The message should be generic (do not reveal if email exists)
        expect(body.message).toMatch(/email|sent|check|instructions/i);
    });

    test('[POST] Request password reset — non-existent email still returns 200 (anti-enumeration)', {
        tag: ['@Regression', '@ForgotPassword', '@Security']
    }, async ({ userController }) => {
        logger.info('Test: Password reset for non-existent email should return 200 (prevent user enumeration)');

        const response = await userController.requestPasswordReset('nonexistent-user@nowhere.invalid');
        const body = await response.json();

        // Anti-enumeration: same response regardless of whether email exists
        expect(response.status()).toBe(200);
        expect(body.success).toBe(true);
        logger.info('Anti-enumeration: same 200 response for non-existent email ✓');
    });

    test('[POST] Change password — invalid current password returns 401', {
        tag: ['@Negative', '@ChangePassword']
    }, async ({ userController }) => {
        logger.info('Test: Change password with wrong current password');

        const response = await userController.changePassword({
            currentPassword: 'WrongCurrentPassword!!!',
            newPassword: 'NewSecurePass123!'
        });
        const body = await response.json();

        logger.info(`Change password status: ${response.status()}`);
        expect(response.status()).toBe(401);
        expect(body.success).toBe(false);
        expect(body.error.message).toMatch(/current password|incorrect|invalid/i);
    });

    test('[POST] Change password — weak new password returns 400', {
        tag: ['@Negative', '@ChangePassword']
    }, async ({ userController }) => {
        logger.info('Test: Change password to a weak password');

        const response = await userController.changePassword({
            currentPassword: process.env.PASSWORD ?? 'password123',
            newPassword: '123' // Too short / too weak
        });
        const body = await response.json();

        expect(response.status()).toBe(400);
        expect(body.success).toBe(false);
        expect(body.error.message).toMatch(/password|weak|complexity|length|minimum/i);
    });
});