import React, { useContext, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import AnimationWrapper from "../common/page-animation";
import Loader from "../components/loader.component";
import AboutUser from "../components/about.component";
import InpageNavigation from "../components/inpage-navigation.component";
import BlogPostCard from "../components/blog-post.component";
import NoDataMessage from "../components/nodata.component";
import LoadMoreDataBtn from "../components/load-more.component";
import PageNotFound from "./404.page";
import { getUser, getUserBlogs } from "../firebase/firestore-operations";
import {
	collection,
	query,
	where,
	orderBy,
	limit,
	startAfter,
	getDocs,
} from "firebase/firestore";
import { db } from "../firebase/firebase";
import { useRecoilValue } from "recoil";
import { userAuthState } from "../recoil/atoms";

const ProfilePage = () => {
	const { id } = useParams();
	const [profile, setProfile] = useState(null);
	const [loading, setLoading] = useState(true);
	const [blogs, setBlogs] = useState({
		results: [],
		lastVisible: null,
		hasMore: true,
	});
	const [profileLoaded, setProfileLoaded] = useState("");

	const userAuth = useRecoilValue(userAuthState);

	const fetchUserProfile = async () => {
		try {
			const userData = await getUser(id);
			if (userData) {
				setProfile(userData);
				setProfileLoaded(id);
				fetchUserBlogs(id);
			}
			setLoading(false);
		} catch (err) {
			console.log(err);
			setLoading(false);
		}
	};

	const fetchUserBlogs = async (id, page = 1) => {
		try {
			const blogsRef = collection(db, "blogs");
			let q = query(
				blogsRef,
				where("author.id", "==", id),
				where("draft", "==", false),
				orderBy("publishedAt", "desc"),
				limit(5)
			);

			if (blogs.lastVisible) {
				q = query(q, startAfter(blogs.lastVisible));
			}

			const querySnapshot = await getDocs(q);
			const fetchedBlogs = querySnapshot.docs.map((doc) => ({
				id: doc.id,
				...doc.data(),
			}));

			const lastVisible = querySnapshot.docs[querySnapshot.docs.length - 1];
			const hasMore = querySnapshot.docs.length === 5;

			setBlogs((prevBlogs) => ({
				results:
					page === 1 ? fetchedBlogs : [...prevBlogs.results, ...fetchedBlogs],
				lastVisible,
				hasMore,
			}));
		} catch (error) {
			console.error("Error fetching user blogs: ", error);
		}
	};

	useEffect(() => {
		if (id !== profileLoaded) {
			setBlogs(null);
			setProfile(null);
			fetchUserProfile();
		}
	}, [id, profileLoaded]);

	useEffect(() => {
		console.log("Updated blogs state:", blogs);
	}, [blogs]);

	return (
		<AnimationWrapper>
			{loading ? (
				<Loader />
			) : profile ? (
				<section className="h-cover md:flex flex-row-reverse items-start gap-5 min-[1100px]:gap-12">
					<div className="flex flex-col max-md:items-center gap-5 min-w-[250px] md:w-[50%] md:pl-8 md:border-l border-grey md:sticky md:top-[100px] md:py-10">
						<img
							src={profile.personal_info.profile_img}
							className="w-48 h-48 bg-grey rounded-full md:w-32 md:h-32"
							alt="Profile"
						/>
						<h1 className="text-2xl font-medium">
							@{profile.personal_info.username}
						</h1>
						<p className="text-xl capitalize h-6">
							{profile.personal_info.fullname}
						</p>
						<p>
							{profile.account_info.total_posts.toLocaleString()} Blogs -{" "}
							{profile.account_info.total_reads.toLocaleString()} Reads
						</p>
						<div className="flex gap-4 mt-2">
							{id === userAuth.id ? (
								<Link
									to="/settings/edit-profile"
									className="btn-light rounded-md"
								>
									Edit Profile
								</Link>
							) : (
								""
							)}
						</div>
						<AboutUser
							className="max-md:hidden"
							bio={profile.personal_info.bio}
							social_links={profile.social_links}
							joinedAt={profile.joinedAt}
						/>
					</div>

					<div className="max-md:mt-12 w-full">
						<InpageNavigation
							routes={["Blogs Published", "About"]}
							defaultHidden={["About"]}
						>
							<>
								{blogs === null ? (
									<Loader />
								) : blogs.results.length ? (
									blogs.results.map((blog, i) => (
										<AnimationWrapper
											key={i}
											transition={{ duration: 1, delay: i * 0.1 }}
										>
											<BlogPostCard
												content={blog}
												author={blog.author.personal_info}
											/>
										</AnimationWrapper>
									))
								) : (
									<NoDataMessage message="No blogs published" />
								)}
								{blogs && blogs.results.length > 0 && blogs.hasMore && (
									<LoadMoreDataBtn
										state={blogs}
										fetchDataFun={() =>
											fetchUserBlogs(id, blogs.results.length / 5 + 1)
										}
									/>
								)}
							</>
							<AboutUser
								bio={profile.personal_info.bio}
								social_links={profile.social_links}
								joinedAt={profile.joinedAt?.toDate().toDateString()}
							/>
						</InpageNavigation>
					</div>
				</section>
			) : (
				<PageNotFound />
			)}
		</AnimationWrapper>
	);
};

export default ProfilePage;
