import { UserModel, IUser, RefreshTokenModel, IRefreshToken } from "../db/schema"; // Import Mongoose models
import { hashPassword, verifyPassword } from "../utils/password";
import { NotFoundError, ApiError } from "../middleware/error";

export type User = IUser;

export interface NewUser {
  pseudo?: string | null;
  email: string;
  password?: string | null;
  role?: string | null;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface TokenData {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export class UserService {
  async createUser(userData: NewUser): Promise<IUser> {
    const role = userData.role || "1000";

    if (userData.email) {
      const existingUser = await UserModel.findOne({ email: userData.email.toLowerCase() });
      if (existingUser) {
        throw new ApiError("Email already in use", 409);
      }
    }

    const userToInsertData: Partial<IUser> = {
      email: userData.email.toLowerCase(),
      pseudo: userData.pseudo,
      role: role,
    };

    if (userData.password) {
      userToInsertData.password_hash = await hashPassword(userData.password);
    }

    const newUser = new UserModel(userToInsertData);
    await newUser.save();
    return newUser;
  }

  async getUserById(id: string): Promise<IUser> {
    const user = await UserModel.findById(id);
    if (!user) {
      throw new NotFoundError("User not found");
    }
    return user;
  }

  async getUserByEmail(email: string): Promise<IUser> {
    const user = await UserModel.findOne({ email: email.toLowerCase() });
    if (!user) {
      throw new NotFoundError("User not found");
    }
    return user;
  }

  async getAllUsers(): Promise<IUser[]> {
    return await UserModel.find();
  }

  async updateUser(id: string, userData: Partial<NewUser>): Promise<IUser> {
    const updateData: Partial<IUser> = {};
    if (userData.pseudo !== undefined) updateData.pseudo = userData.pseudo;
    if (userData.email !== undefined) updateData.email = userData.email.toLowerCase();
    if (userData.role !== undefined) updateData.role = userData.role || "1000";


    if (userData.password) {
      updateData.password_hash = await hashPassword(userData.password);
    }

    const updatedUser = await UserModel.findByIdAndUpdate(id, { $set: updateData }, { new: true });
    if (!updatedUser) {
      throw new NotFoundError("User not found");
    }
    return updatedUser;
  }

  async deleteUser(id: string): Promise<boolean> {
    const result = await UserModel.findByIdAndDelete(id);
    return !!result;
  }

  async isEmailUsed(email: string): Promise<boolean> {
    const user = await UserModel.findOne({ email: email.toLowerCase() });
    return !!user;
  }

  async authenticate(email: string, password: string): Promise<IUser> {
    const user = await this.getUserByEmail(email);
    if (!user.password_hash) {
      throw new ApiError("Invalid credentials", 401);
    }
    const isValid = await verifyPassword(password, user.password_hash);
    if (!isValid) {
      throw new ApiError("Invalid credentials", 401);
    }
    return user;
  }

  async storeRefreshToken(id: string, token: string, expiresAt: string | Date): Promise<void> {
    await RefreshTokenModel.create({
      token,
      user_id: id,
      expires_at: new Date(expiresAt),
    });
  }

  async validateRefreshToken(token: string): Promise<string> {
    const refreshTokenDoc = await RefreshTokenModel.findOne({ token });
    if (!refreshTokenDoc) {
      throw new ApiError("Invalid refresh token", 401);
    }
    if (new Date(refreshTokenDoc.expires_at) < new Date()) {
      await RefreshTokenModel.deleteOne({ token });
      throw new ApiError("Refresh token expired", 401);
    }
    return refreshTokenDoc.user_id;
  }

  async deleteRefreshTokens(id: string): Promise<void> {
    await RefreshTokenModel.deleteMany({ user_id: id });
  }
}

export const userService = new UserService();