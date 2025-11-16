/**Configuration for design variations. Edit this to change configs */
export const VARIATION_CONFIG = {
   /**Number of variations to generate */
    COUNT: 3,
    /** How long you want to cache your initial generations */
    AUTO_CACHE_DURATION: 3600000, // 1 hour in milliseconds
    /** How long you want to cache your custom generations */
    CUSTOM_CACHE_DURATION: 7200000, // 2 hours in milliseconds
    /** Maximum number of different elements you want to keep cached at once */
    MAX_CACHE_SIZE: 100, // Maximum number of cached variations
    /** Height of preview design */
    PREVIEW_HEIGHT: 120,
    /** Width of preview design */
    PREVIEW_WIDTH: 280,
    /** Backend API endpoint for generating variations */
    API_ENDPOINT: '/api/generate-variations/',
}as const;