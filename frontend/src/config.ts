// Get the base URL from environment variable
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

// Remove any trailing slashes
const normalizedApiUrl = API_URL.replace(/\/+$/, '');

export { normalizedApiUrl as API_URL }; 