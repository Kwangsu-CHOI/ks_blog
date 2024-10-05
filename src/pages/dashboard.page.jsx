import React, { useContext, useEffect } from "react";
import { Link } from "react-router-dom";
import { useRecoilValue, useRecoilState } from "recoil";
import { userAuthState, themeState } from "../recoil/atoms";

const Dashboard = ({ user, recentPosts, stats, notifications }) => {
	const userAuth = useRecoilValue(userAuthState);
	const [theme, setTheme] = useRecoilState(themeState);

	useEffect(() => {
		console.log(userAuth);
	}, [userAuth]);

	return (
		<div className="p-6 max-w-4xl mx-auto">
			<h1 className="text-4xl font-bold mb-8">
				Hi, {userAuth.personal_info.fullname} 😁
			</h1>

			<div className="rounded-lg shadow-lg p-6 mb-12">
				<h2 className="text-xl font-semibold mb-6">Activity Summary</h2>
				<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
					<div
						className={`bg-gray-700 p-4 rounded-lg flex items-center ${
							theme === "dark" ? "bg-gray-700" : "bg-gray-300"
						}`}
					>
						<i className="fi fi-rr-circle-user text-3xl text-blue-400 mr-4"></i>
						<div>
							<p className="text-sm text-gray-400">Username</p>
							<p className="text-xl font-bold">
								@{userAuth.personal_info.username}
							</p>
						</div>
					</div>
					<div
						className={`bg-gray-700 p-4 rounded-lg flex items-center ${
							theme === "dark" ? "bg-gray-700" : "bg-gray-300"
						}`}
					>
						<i className="fi fi-rr-file-edit text-3xl text-green-400 mr-4"></i>
						<div>
							<p className="text-sm text-gray-400">Total Posts</p>
							<p className="text-xl font-bold">
								{userAuth.account_info.total_posts}
							</p>
						</div>
					</div>
					<div
						className={`bg-gray-700 p-4 rounded-lg flex items-center ${
							theme === "dark" ? "bg-gray-700" : "bg-gray-300"
						}`}
					>
						<i className="fi fi-rr-eye text-3xl text-purple-400 mr-4"></i>
						<div>
							<p className="text-sm text-gray-400">Total Reads</p>
							<p className="text-xl font-bold">
								{userAuth.account_info.total_reads}
							</p>
						</div>
					</div>
				</div>
			</div>

			<div className="rounded-lg shadow-lg p-6">
				<h2 className="text-xl font-semibold mb-4">Quick Links</h2>
				<div className="flex flex-wrap gap-4">
					<a
						href="/editor"
						className="btn-dark px-6 py-2 rounded-full hover:bg-green-400 transition duration-300"
					>
						Write a New Post
					</a>
					<a
						href="/settings/edit-profile"
						className="btn-dark px-6 py-2 rounded-full hover:bg-gray-700 hover:bg-green-400 transition duration-300"
					>
						Edit Profile
					</a>
					<a
						href="/dashboard/blogs"
						className="btn-dark px-6 py-2 rounded-full hover:bg-gray-700 hover:bg-green-400 transition duration-300"
					>
						Manage My Blogs
					</a>
				</div>
			</div>
		</div>
	);
};

export default Dashboard;
