import mongoose, { Schema, Model } from 'mongoose';
import { IUser } from '../types/index';

const userSchema = new Schema<IUser>(
    {
        email: {
            type: String,
            required: [true, 'Email is required'],
            unique: true,
            lowercase: true,
            trim: true,
            match: [
                /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                'Please enter a valid email address',
            ],
        },
        password: {
            type: String,
            minlength: [6, 'Password must be at least 6 characters long'],
            // Not required for Google OAuth users
        },
        name: {
            type: String,
            required: [true, 'Name is required'],
            trim: true,
            minlength: [2, 'Name must be at least 2 characters long'],
            maxlength: [50, 'Name cannot exceed 50 characters'],
        },
        isVerified: {
            type: Boolean,
            default: false,
        },
        googleId: {
            type: String,
            sparse: true, // Allow multiple null values but unique non-null values
        },
        otp: {
            type: String,
            length: 6,
        },
        otpExpiry: {
            type: Date,
        },
    },
    {
        timestamps: true,
        toJSON: {
            transform: function (doc, ret) {
                ret.id = ret._id;
                delete (ret as any)._id;
                delete (ret as any).__v;
                delete (ret as any).password;
                delete (ret as any).otp;
                delete (ret as any).otpExpiry;
                return ret;
            },
        },
    }
);

// Indexes for performance
userSchema.index({ email: 1 });
userSchema.index({ googleId: 1 });
userSchema.index({ otpExpiry: 1 }, { expireAfterSeconds: 0 });

// Pre-save middleware to ensure validation
userSchema.pre('save', function (next) {
    // Ensure either password or googleId is present
    if (!this.password && !this.googleId) {
        return next(new Error('Either password or googleId must be provided'));
    }
    next();
});

// Static methods
userSchema.statics.findByEmail = function (email: string) {
    return this.findOne({ email: email.toLowerCase() });
};

userSchema.statics.findByGoogleId = function (googleId: string) {
    return this.findOne({ googleId });
};

// Instance methods
userSchema.methods.generateOTP = function (): string {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    this.otp = otp;
    this.otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    return otp;
};

userSchema.methods.isOTPValid = function (otp: string): boolean {
    return this.otp === otp && this.otpExpiry && new Date() < this.otpExpiry;
};

userSchema.methods.clearOTP = function (): void {
    this.otp = undefined;
    this.otpExpiry = undefined;
};

userSchema.methods.toUserResponse = function () {
    return {
        id: this._id.toString(),
        email: this.email,
        name: this.name,
        isVerified: this.isVerified,
        createdAt: this.createdAt,
    };
};

// Interface for static methods
interface IUserModel extends Model<IUser> {
    findByEmail(email: string): Promise<IUser | null>;
    findByGoogleId(googleId: string): Promise<IUser | null>;
}

export const User: IUserModel = mongoose.model<IUser, IUserModel>('User', userSchema);
