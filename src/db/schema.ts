import mongoose, { Schema, Document, Model } from 'mongoose';


// --- User Schema ---
export interface IUser extends Document {
  pseudo?: string | null;
  email: string;
  password_hash?: string | null;
  role?: string | null;
  // Mongoose adds _id (ObjectId) and __v (versionKey) automatically
}

const UserSchema = new Schema<IUser>({
  pseudo: { type: String, trim: true },
  email: { type: String, required: true, unique: true, trim: true, lowercase: true },
  password_hash: { type: String },
  role: { type: String, default: '1000' },
}, { timestamps: true }); // Adds createdAt and updatedAt

export const UserModel: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

// --- Module Schema ---
export interface IModule extends Document {
  name?: string | null;
  content?: string | null;
  user_id?: mongoose.Schema.Types.ObjectId | null; // Reference to User
}
const ModuleSchema = new Schema<IModule>({
  name: { type: String },
  content: { type: String },
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });
export const ModuleModel: Model<IModule> = mongoose.models.Module || mongoose.model<IModule>('Module', ModuleSchema);

// --- Course Schema ---
export interface ICourse extends Document {
  name: string;
  content: string;
  module_id: mongoose.Schema.Types.ObjectId; // Reference to Module
  level: number;
  likes: number;
  views: number;
  public: boolean;
  chat_id?: mongoose.Schema.Types.ObjectId | null; // Reference to Chat (if you create a Chat model)
}
const CourseSchema = new Schema<ICourse>({
  name: { type: String, required: true },
  content: { type: String, required: true },
  module_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Module', required: true },
  level: { type: Number, default: 0 },
  likes: { type: Number, default: 0 },
  views: { type: Number, default: 0 },
  public: { type: Boolean, default: false },
  // chat_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Chat' }, // Define Chat model if needed
}, { timestamps: true });
export const CourseModel: Model<ICourse> = mongoose.models.Course || mongoose.model<ICourse>('Course', CourseSchema);

// --- Info Schema ---
export interface IInfo extends Document {
  cgu: string;
  legal_mentions?: string | null;
}

const InfoSchema = new Schema<IInfo>({
  cgu: { type: String, required: true, default: "Default Terms and Conditions" },
  legal_mentions: { type: String, default: "Default Legal Mentions" },
}, { timestamps: true });

export const InfoModel: Model<IInfo> = mongoose.models.Info || mongoose.model<IInfo>('Info', InfoSchema);



// --- RefreshToken Schema ---
export interface IRefreshToken extends Document {
  token: string;
  user_id: string; // Or: user_id: mongoose.Schema.Types.ObjectId (if referencing User._id)
  expires_at: Date;
}

const RefreshTokenSchema = new Schema<IRefreshToken>({
  token: { type: String, required: true, unique: true },
  user_id: { type: String, required: true }, // Example: if storing email or a string ID
  // If referencing User model's ObjectId:
  // user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  expires_at: { type: Date, required: true },
}, { timestamps: true });

export const RefreshTokenModel: Model<IRefreshToken> = mongoose.models.RefreshToken || mongoose.model<IRefreshToken>('RefreshToken', RefreshTokenSchema);

// You will need to define Mongoose schemas for `chats`, `assets`, and `subscriptions` similarly.
// Remember to replace foreign key references (e.g., `integer("user_id").references(() => users.id)`)
// with Mongoose ObjectId references: `user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }`.
