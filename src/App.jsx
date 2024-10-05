import { Route, Routes } from "react-router-dom";
import Navbar from "./components/navbar.component";
import UserAuthForm from "./pages/userAuthForm.page";
import React, { useEffect } from "react";
import { lookInSession } from "./common/session";
import Editor from "./pages/editor.pages";
import HomePage from "./pages/home.page";
import SearchPage from "./pages/search.page";
import PageNotFound from "./pages/404.page";
import ProfilePage from "./pages/profile.page";
import BlogPage from "./pages/blog.page";
import SideNav from "./components/sidenavbar.component";
import ChangePassword from "./pages/change-password.page";
import EditProfile from "./pages/edit-profile.page";
import Notifications from "./pages/notifications.page";
import ManageBlogs from "./pages/manage-blogs.page";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebase/firebase";
import { getUser } from "./firebase/firestore-operations";
import Dashboard from "./pages/dashboard.page";
import { RecoilRoot, useSetRecoilState, useRecoilValue } from "recoil";
import { userAuthState, isAuthLoadingState, themeState } from "./recoil/atoms";

const AuthStateManager = () => {
	const setUserAuth = useSetRecoilState(userAuthState);
	const setIsAuthLoading = useSetRecoilState(isAuthLoadingState);
	const setTheme = useSetRecoilState(themeState);

	useEffect(() => {
		let themeInSession = localStorage.getItem("theme");

		if (themeInSession) {
			setTheme(themeInSession);
			document.body.setAttribute("data-theme", themeInSession);
		} else {
			document.body.setAttribute("data-theme", "light");
		}

		const unsubscribe = onAuthStateChanged(auth, async (user) => {
			setIsAuthLoading(true);
			if (user) {
				try {
					const userData = await getUser(user.uid);
					const newUserAuth = userData || {
						id: user.uid,
						new_notification_available: false,
						isAdmin: false,
						personal_info: {
							fullname: user.displayName,
							email: user.email,
							username: user.email.split("@")[0],
							profile_img: user.photoURL,
						},
					};
					setUserAuth(newUserAuth);
				} catch (error) {
					console.error("Error setting user auth:", error);
					setUserAuth(null);
				}
			} else {
				setUserAuth(null);
			}
			setIsAuthLoading(false);
		});

		return () => unsubscribe();
	}, [setUserAuth, setIsAuthLoading, setTheme]);

	return null;
};

function App() {
	return (
		<RecoilRoot>
			<AuthStateManager />
			<Routes>
				<Route path="/editor" element={<Editor />} />
				<Route path="/editor/:blog_id" element={<Editor />} />
				<Route path="/" element={<Navbar />}>
					<Route index element={<HomePage />} />
					<Route path="dashboard" element={<SideNav />}>
						<Route index element={<Dashboard />} />
						<Route path="blogs" element={<ManageBlogs />} />
						<Route path="notifications" element={<Notifications />} />
					</Route>
					<Route path="settings" element={<SideNav />}>
						<Route path="edit-profile" element={<EditProfile />} />
						<Route path="change-password" element={<ChangePassword />} />
					</Route>
					<Route path="signin" element={<UserAuthForm type="sign-in" />} />
					<Route path="signup" element={<UserAuthForm type="sign-up" />} />
					<Route path="search/:query" element={<SearchPage />} />
					<Route path="user/:id" element={<ProfilePage />} />
					<Route path="blog/:blog_id" element={<BlogPage />} />
					<Route path="*" element={<PageNotFound />} />
				</Route>
			</Routes>
		</RecoilRoot>
	);
}

export default App;
