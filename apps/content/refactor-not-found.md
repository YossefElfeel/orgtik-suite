# Refactor Not-Allowed Route Implementation

**Goal**: Implement a configurable authentication redirection logic using a new environment variable `NEXT_PUBLIC_ENABLE_AUTH_DEV`.

## 1. Environment Setup
- Add `NEXT_PUBLIC_ENABLE_AUTH_DEV` to the `.env` file.
- It should default to `false` in production-like environments and be toggleable for local development.

## 2. Update Constants
- Modify `@\constants\index.ts`.
- Replace the current logic for `AUTH_REDIRECT_URL`:
  ```typescript
  // Current logic
  export const AUTH_REDIRECT_URL = IS_DEVELOPMENT ? "/auth/not-allowed" : SOS_URL;
  ```
- **New Logic**: Use `(process.env.NEXT_PUBLIC_ENABLE_AUTH_DEV === "true" && IS_DEVELOPMENT)` to determine the value. 
  - If `true`, set `AUTH_REDIRECT_URL` to `"/auth/not-allowed"`.
  - If `false`, set `AUTH_REDIRECT_URL` to `SOS_URL` (imported from `@somion/sos-bar`).

## 3. Update Middleware (`proxy.ts` or `middleware.ts`)
- Modify `@\proxy.ts` or `@\middleware.ts` to enforce route access:
  - **Redirect Logic**: Ensure that when a user is unauthenticated (no token), they are redirected to the current `AUTH_REDIRECT_URL`.
  - **Route Protection**: If the redirection logic evaluates to `false` (i.e., not in Dev or `NEXT_PUBLIC_ENABLE_AUTH_DEV` is off), any attempt to access the `/auth/not-allowed` route should be blocked (e.g., redirect to the root `/` or the `SOS_URL`) to make the route "unreachable".

## 4. Verify API Handling & Logout Logic
- Ensure `@\redux\app\baseApi.ts` correctly uses the updated `AUTH_REDIRECT_URL` in the `handleUserLogout` function when a 401 Unauthorized response is received from the API.
- Update the logout logic in any UI components (e.g., `ProfileDropdown`) to redirect to `AUTH_REDIRECT_URL` instead of hardcoded `SOS_URL`.


## Reference
Use the existing `AUTH_REDIRECT_URL` pattern in `constants/index.ts` to ensure the redirect target is managed in a single, reusable location across the application.
