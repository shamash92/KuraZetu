import {signOut} from "./session";

export async function handleUnauthorized(response: Response) {
    if (response.status !== 401) return false;

    await signOut("expire");
    return true;
}
