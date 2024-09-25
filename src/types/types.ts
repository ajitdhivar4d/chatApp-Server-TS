declare global {
  namespace Express {
    interface Request {
      user?: string;
    }
  }
}

// declare module "socket.io" {
//   interface Socket {
//     user?: IUser;
//   }
// }
