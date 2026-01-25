/**
 * Environment variable utility class.
 * Provides access to configuration values from environment variables.
 */
export default class ENV {
  /**
   * Gets the base URL for the API.
   */
  public static get BASE_URL(): string {
    return process.env.BASE_URL || "https://api.example.com";
  }

  /**
   * Gets the username from environment variables.
   */
  public static get USERNAME(): string {
    return (process.env.npm_config_username ?? process.env.USERNAME) || "";
  }

  /**
   * Gets the password from environment variables.
   */
  public static get PASSWORD(): string {
    return (process.env.npm_config_password ?? process.env.PASSWORD) || "";
  }

  /**
   * Gets the authentication token from environment variables.
   */
  public static get TOKEN(): string {
    return process.env.TOKEN ?? "";
  }
}
