import {deleteFromSecureStore} from "./secureStore";
import {router} from "expo-router";

export async function handleLogout() {
    // await deleteFromSecureStore("userToken");
    await deleteFromSecureStore("userID");

    router.replace("/auth");
}
