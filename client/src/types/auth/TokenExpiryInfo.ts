export interface TokenExpiryInfo {
  lastRefresh: number;
  expiresIn: number; // milliseconds
  nextRefresh: number;
}
