import { userSocketIDs } from "../app.js";
// Helper function to convert file to Base64 (Assuming file is a Buffer)
export const getBase64 = (file) => {
    return `data:image/jpeg;base64,${file.toString("base64")}`;
};
// Function to get the other member in a chat who is not the current user
export const getOtherMember = (members, userId) => {
    if (!Array.isArray(members) || members.length < 2) {
        throw new Error("Invalid members array. At least two members are required.");
    }
    const otherUser = members.find((member) => !member._id.equals(userId));
    if (!otherUser) {
        throw new Error("Other member not found in chat");
    }
    return otherUser;
};
export const getSockets = (users = []) => {
    const sockets = users.map((user) => userSocketIDs.get(user.toString()));
    return sockets;
};
