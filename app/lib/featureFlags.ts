/**
 * Feature Flags Configuration
 * 
 * This file contains global flags to control feature access across the application.
 */

/**
 * PATRON_PAYWALL_ENABLED
 * 
 * Controls whether certain premium features (Hot Pocket Generator, Insights, Top 100)
 * require Patreon patron status to access.
 * 
 * - When `true`: Features are locked behind Patreon patron check (patronLevel > 0)
 * - When `false`: Features are accessible to all users (logged in or not)
 * 
 * Set to `false` for now until Patreon is ready.
 */
export const PATRON_PAYWALL_ENABLED = false;

