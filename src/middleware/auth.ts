import { Elysia } from "elysia";

// Role enum for backwards compatibility
export enum Role {
    Learner = 0,
    Teacher = 1,
    Conceptor = 2,
    Admin = 3,
}

// JWT claims interface for backwards compatibility
export interface JwtClaims {
    sub: string; // User email
    role: string; // User role as a string like "1000"
    exp: number; // Expiration time
}

/**
 * Setup auth middleware plugin for Elysia
 * This is a dummy function that does nothing - auth checks have been removed
 */
export function setupAuth() {
    return new Elysia({ name: "auth" });
}
