import { ApiError } from "../middleware/error";

// GitHub OAuth configuration
const CLIENT_ID_GITHUB = process.env.CLIENT_ID_GITHUB || "";
const CLIENT_SECRET_GITHUB = process.env.CLIENT_SECRET_GITHUB || "";
const REDIRECT_URI_GITHUB = process.env.REDIRECT_URI_GITHUB || "http://localhost:5173/auth/github/callback";

// GitHub API endpoints
const GITHUB_AUTH_URL = "https://github.com/login/oauth/authorize";
const GITHUB_TOKEN_URL = "https://github.com/login/oauth/access_token";
const GITHUB_USER_URL = "https://api.github.com/user";

export interface GitHubUser {
  id: number;
  login: string;
  email: string | null;
  name: string | null;
  avatar_url: string | null;
  bio: string | null;
}

export class GitHubOAuthService {
  /**
   * Generate GitHub OAuth authorization URL
   * @param state Optional state parameter for CSRF protection
   * @returns Authorization URL
   */
  getAuthorizationUrl(state?: string): string {
    const params = new URLSearchParams({
      client_id: CLIENT_ID_GITHUB,
      redirect_uri: REDIRECT_URI_GITHUB,
      scope: "read:user user:email",
      ...(state && { state }),
    });

    return `${GITHUB_AUTH_URL}?${params.toString()}`;
  }

  /**
   * Exchange authorization code for access token
   * @param code Authorization code from GitHub
   * @returns Access token
   */
  async getAccessToken(code: string): Promise<string> {
    try {
      const response = await fetch(GITHUB_TOKEN_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          client_id: CLIENT_ID_GITHUB,
          client_secret: CLIENT_SECRET_GITHUB,
          code,
          redirect_uri: REDIRECT_URI_GITHUB,
        }),
      });

      if (!response.ok) {
        throw new ApiError("Failed to get access token from GitHub", 400);
      }

      const data = await response.json();

      if (data.error) {
        throw new ApiError(`GitHub OAuth error: ${data.error_description || data.error}`, 400);
      }

      return data.access_token;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError("Failed to exchange code for access token", 500);
    }
  }

  /**
   * Get GitHub user information using access token
   * @param accessToken GitHub access token
   * @returns GitHub user information
   */
  async getUserInfo(accessToken: string): Promise<GitHubUser> {
    try {
      const response = await fetch(GITHUB_USER_URL, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        throw new ApiError("Failed to get user info from GitHub", 400);
      }

      const userData = await response.json();

      // If email is not public, fetch it from the emails endpoint
      let email = userData.email;
      if (!email) {
        email = await this.getPrimaryEmail(accessToken);
      }

      return {
        id: userData.id,
        login: userData.login,
        email,
        name: userData.name,
        avatar_url: userData.avatar_url,
        bio: userData.bio,
      };
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError("Failed to get user information from GitHub", 500);
    }
  }

  /**
   * Get user's primary email from GitHub (if not public)
   * @param accessToken GitHub access token
   * @returns Primary email address
   */
  private async getPrimaryEmail(accessToken: string): Promise<string | null> {
    try {
      const response = await fetch("https://api.github.com/user/emails", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        return null;
      }

      interface GitHubEmail {
        email: string;
        primary: boolean;
        verified: boolean;
        visibility?: string;
      }
      const emails: GitHubEmail[] = await response.json();
      const primaryEmail = emails.find((e) => e.primary && e.verified);

      return primaryEmail?.email || null;
    } catch (error) {
      console.error("Failed to fetch GitHub user emails:", error);
      return null;
    }
  }

  /**
   * Complete OAuth flow: exchange code for token and get user info
   * @param code Authorization code from GitHub
   * @returns GitHub user information
   */
  async authenticate(code: string): Promise<GitHubUser> {
    const accessToken = await this.getAccessToken(code);
    return await this.getUserInfo(accessToken);
  }
}

// Export singleton instance
export const githubOAuthService = new GitHubOAuthService();
