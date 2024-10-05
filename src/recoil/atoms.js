import { atom } from "recoil";
import { recoilPersist } from "recoil-persist";

const { persistAtom } = recoilPersist();

export const userAuthState = atom({
	key: "userAuthState",
	default: null,
	effects_UNSTABLE: [persistAtom],
});

export const isAuthLoadingState = atom({
	key: "isAuthLoadingState",
	default: true,
});

export const themeState = atom({
	key: "themeState",
	default: "light",
	effects_UNSTABLE: [persistAtom],
});
