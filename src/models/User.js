const mongoose = require("mongoose");

const { Schema } = mongoose;

// Firebase Admin handles authentication; this model stores app-level user data.
const userSchema = new Schema(
    {
        firebaseUid: {
            type: String,
            required: true,
            unique: true,
            index: true,
            trim: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
            index: true,
            lowercase: true,
            trim: true,
        },
        displayName: {
            type: String,
            trim: true,
            default: "",
        },
        photoURL: {
            type: String,
            trim: true,
            default: "",
        },
        role: {
            type: String,
            enum: ["manager", "user"],
            default: "user",
        },
        provider: {
            type: String,
            trim: true,
            default: "password",
        },
        emailVerified: {
            type: Boolean,
            default: false,
        },
        lastLoginAt: {
            type: Date,
            default: null,
        },
    },
    {
        timestamps: true,
        versionKey: false,
    }
);

module.exports = mongoose.model("User", userSchema);