import mongoose, {
  Schema,
  model,
  Document,
  Model,
  CallbackError,
  Types,
} from "mongoose";
import { hash } from "bcrypt";

// Define an interface for the User document
export interface IUser extends Document {
  _id: Types.ObjectId;
  name: string;
  bio: string;
  username: string;
  password: string;
  avatar: {
    public_id: string;
    url: string;
  };
}

// Define the schema
const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: true,
    },
    bio: {
      type: String,
      required: true,
    },
    username: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
      select: false,
    },
    avatar: {
      public_id: {
        type: String,
        required: true,
      },
      url: {
        type: String,
        required: true,
      },
    },
  },
  {
    timestamps: true,
  },
);

// Define a pre-save middleware to hash the password
userSchema.pre<IUser>("save", async function (next) {
  if (!this.isModified("password")) return next();

  try {
    this.password = await hash(this.password, 10);
    next();
  } catch (error) {
    next(error as CallbackError);
  }
});

// Define the User model
const User: Model<IUser> =
  mongoose.models.User || model<IUser>("User", userSchema);

export default User;
