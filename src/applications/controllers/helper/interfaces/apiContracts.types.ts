/**
 * Standard API response envelope for all Flipkart Commerce Platform endpoints.
 *
 * Every REST response is wrapped in this structure. Controllers and test
 * assertions should type the body against these interfaces rather than using
 * `unknown` or untyped JSON to catch schema drift at compile time.
 */

// ─── Core Envelope ────────────────────────────────────────────────────────────

export interface ApiResponse<T = unknown> {
    success: boolean;
    data: T;
    error?: ApiError;
    meta?: ResponseMeta;
}

export interface ApiError {
    code: string;
    message: string;
    details?: Record<string, unknown>;
}

export interface ResponseMeta {
    requestId: string;
    timestamp: string;
    version: string;
}

// ─── Pagination ───────────────────────────────────────────────────────────────

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
    pagination: Pagination;
}

export interface Pagination {
    currentPage: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export interface AuthTokenResponse {
    accessToken: string;
    refreshToken: string;
    expiresAt: string;
    userId: string;
    tokenType: "Bearer";
}

// ─── Product ──────────────────────────────────────────────────────────────────

export interface ProductVariant {
    size: string;
    color: string;
    sku: string;
    quantity: number;
}

export interface Product {
    id: string;
    name: string;
    description: string;
    sku: string;
    brand: string;
    category: string;
    subcategory: string;
    price: number;
    salePrice: number | null;
    currency: "INR" | "USD";
    images: string[];
    variants: ProductVariant[];
    isActive: boolean;
    isFeatured: boolean;
    createdAt: string;
    updatedAt: string;
}

// ─── Cart ─────────────────────────────────────────────────────────────────────

export interface CartItem {
    itemId: string;
    productId: string;
    quantity: number;
    price: number;
    size: string | null;
    color: string | null;
}

export interface Cart {
    cartId: string;
    userId: string | null;
    items: CartItem[];
    subtotal: number;
    tax: number | null;
    discount: number | null;
    totalAmount: number;
    couponCode: string | null;
    createdAt: string;
    updatedAt: string;
}

// ─── Order ────────────────────────────────────────────────────────────────────

export type OrderStatus =
    | "pending"
    | "processing"
    | "shipped"
    | "delivered"
    | "cancelled"
    | "return_requested";

export interface Address {
    firstName: string;
    lastName: string;
    addressLine1: string;
    addressLine2?: string | null;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    phone?: string | null;
}

export interface OrderItem {
    itemId: string;
    productId: string;
    quantity: number;
    price: number;
    size: string | null;
    color: string | null;
}

export interface Order {
    orderId: string;
    userId: string;
    status: OrderStatus;
    items: OrderItem[];
    subtotal: number;
    tax: number;
    shipping: number;
    totalAmount: number;
    shippingAddress: Address;
    billingAddress: Address;
    paymentMethod: string;
    shippingMethod: string;
    createdAt: string;
    updatedAt: string;
}

// ─── Payment ──────────────────────────────────────────────────────────────────

export type PaymentStatus =
    | "pending"
    | "processing"
    | "completed"
    | "failed"
    | "refunded"
    | "partially_refunded";

export interface Payment {
    paymentId: string;
    orderId: string;
    status: PaymentStatus;
    amount: number;
    currency: "INR" | "USD";
    paymentMethodId: string | null;
    paymentMethodType: string | null;
    transactionId: string | null;
    createdAt: string;
    updatedAt: string;
}

// ─── User ─────────────────────────────────────────────────────────────────────

export interface UserProfile {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    phone: string | null;
    dateOfBirth: string | null;
    gender: "male" | "female" | "other" | null;
    isEmailVerified: boolean;
    createdAt: string;
    updatedAt: string;
}

// ─── Inventory ────────────────────────────────────────────────────────────────

export interface StockLevel {
    productId: string;
    quantity: number;
    size?: string | null;
    color?: string | null;
    reservedQuantity: number;
    availableQuantity: number;
    lowStockThreshold: number;
    isLowStock: boolean;
}
