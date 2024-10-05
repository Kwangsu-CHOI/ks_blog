import { useContext, useEffect, useRef, useState } from "react";
import { Navigate, NavLink, Outlet } from "react-router-dom";
import Loader from "./loader.component";
import { useRecoilValue } from "recoil";
import { userAuthState, isAuthLoadingState } from "../recoil/atoms";

const SideNav = () => {
	const userAuth = useRecoilValue(userAuthState);
	const isAuthLoading = useRecoilValue(isAuthLoadingState);
	const [pageState, setPageState] = useState("");
	const [showSideNav, setShowSideNav] = useState(false);

	let activeTabLine = useRef();
	let sideBarIconTab = useRef();
	let pageStateTab = useRef();

	let page = location.pathname.split("/")[2];

	useEffect(() => {
		setPageState(page ? page.replace("-", " ") : "");
	}, [page]);

	useEffect(() => {
		setShowSideNav(false);
		if (pageStateTab.current) {
			pageStateTab.current.click();
		}

		return () => {
			setShowSideNav(false);
		};
	}, [pageState]);

	if (isAuthLoading) {
		return <Loader />;
	}

	if (!userAuth) {
		return <Navigate to="/signin" />;
	}

	const { new_notification_available, isAdmin } = userAuth;

	const changePageState = (e) => {
		if (activeTabLine.current && e.target) {
			let { offsetWidth, offsetLeft } = e.target;
			activeTabLine.current.style.width = offsetWidth + "px";
			activeTabLine.current.style.left = offsetLeft + "px";
		}

		if (e.target === sideBarIconTab.current) {
			setShowSideNav(true);
		} else {
			setShowSideNav(false);
		}
	};
	return (
		<>
			<section className=" relative flex gap-10 py-0 m-0 max-md:flex-col">
				<div className="sticky top-[80px] z-30">
					<div className="md:hidden bg-white py-1 border-b border-grey flex flex-nowrap overflow-x-auto">
						<button
							ref={sideBarIconTab}
							className="p-5 capitalize"
							onClick={changePageState}
						>
							<i className="fi fi-rr-bars-staggered pointer-events-none"></i>
						</button>
						<button
							ref={pageStateTab}
							className="p-5 capitalize"
							onClick={changePageState}
						>
							{pageState}
						</button>
						<hr
							ref={activeTabLine}
							className="absolute bottom-0 duration-500"
						/>
					</div>

					{/* i changed max-md:w-[calc(100%+80px)] to max-md:w-full */}
					<div
						className={
							"min-w-[200px] h-[calc(100vh-80px-60px)] md:h-cover md:sticky top-24 overflow-y-auto p-6 md:pr-0 md:border-grey md:border-r absolute max-md:top-[64px] bg-white max-md:w-full max-md:px-16 max-md:-ml-7 duration-500 " +
							(!showSideNav
								? "max-md:opacity-0 max-md:pointer-events-none"
								: "opacity-100 pointer-events-auto")
						}
					>
						<NavLink
							to="/dashboard"
							onClick={(e) => setPageState(e.target.innerText)}
							className="text-xl text-dark-grey mb-3"
						>
							DashBoard
						</NavLink>
						<hr className="border-grey -ml-6 mb-8 mr-6" />

						<NavLink
							to="/dashboard/blogs"
							onClick={(e) => setPageState(e.target.innerText)}
							className="sidebar-link"
						>
							<i className="fi fi-rr-document"></i>
							Blogs
						</NavLink>

						<NavLink
							to="/dashboard/notifications"
							onClick={(e) => setPageState(e.target.innerText)}
							className="sidebar-link"
						>
							<div className="relative">
								<i className="fi fi-rr-bell"></i>
								{new_notification_available ? (
									<span className="bg-red w-2 h-2 rounded-full absolute z-10 top-0 right-0"></span>
								) : (
									""
								)}
							</div>
							Notifications
						</NavLink>

						{isAdmin ? (
							<NavLink
								to="/editor"
								onClick={(e) => setPageState(e.target.innerText)}
								className="sidebar-link"
							>
								<i className="fi fi-rr-file-edit"></i>
								Write
							</NavLink>
						) : (
							""
						)}

						<h1 className="text-xl text-dark-grey mb-3 mt-20">Settings</h1>
						<hr className="border-grey -ml-6 mb-8 mr-6" />
						<NavLink
							to="/settings/edit-profile"
							onClick={(e) => setPageState(e.target.innerText)}
							className="sidebar-link"
						>
							<i className="fi fi-rr-user"></i>
							Edit Profile
						</NavLink>

						<NavLink
							to="/settings/change-password"
							onClick={(e) => setPageState(e.target.innerText)}
							className="sidebar-link"
						>
							<i className="fi fi-rr-lock"></i>
							Change Password
						</NavLink>
					</div>
				</div>
				<div className="max-md:-mt-8 mt-5 w-full">
					<Outlet />
				</div>
			</section>
		</>
	);
};
export default SideNav;
