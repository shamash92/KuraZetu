import * as SecureStore from "expo-secure-store";

export type TSaveSecureStore =
    | "userID"
    | "userFirstName"
    | "userLastName"
    | "userToken"
    | "expoPushToken";

export async function saveToSecureStore(key: TSaveSecureStore, value: any) {
    await SecureStore.setItemAsync(key, value);
}

export async function getFromSecureStore(
    key: TSaveSecureStore,
): Promise<TSaveSecureStore | null> {
    let result = await SecureStore.getItemAsync(key);

    if (result !== null) {
        return result as TSaveSecureStore; // Cast the string result to TSaveSecureStore
    } else {
        return null;
    }
}

export async function deleteFromSecureStore(key: TSaveSecureStore) {
    await SecureStore.deleteItemAsync(key);
}
