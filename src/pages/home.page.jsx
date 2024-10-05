import React, { useEffect, useState } from "react";
import {
	collection,
	query,
	where,
	orderBy,
	limit,
	getDocs,
	startAfter,
} from "firebase/firestore";
import { db } from "../firebase/firebase";
import AnimationWrapper from "../common/page-animation";
import InpageNavigation from "../components/inpage-navigation.component";
import Loader from "../components/loader.component";
import BlogPostCard from "../components/blog-post.component";
import MinimalBlogPost from "../components/nobanner-blog-post.component";
import { activeTabRef } from "../components/inpage-navigation.component";
import NoDataMessage from "../components/nodata.component";
import LoadMoreDataBtn from "../components/load-more.component";

const HomePage = () => {
	const [blogs, setBlogs] = useState({
		results: [],
		lastVisible: null,
		hasMore: true,
	});
	const [trendingBlogs, setTrendingBlogs] = useState(null);
	const [pageState, setPageState] = useState("home");

	let categories = [
		"travel",
		"food",
		"tech",
		"hobby",
		"hot place",
		"cooking",
		"finance",
		"movie",
		"TV series",
		"coding",
	];

	const fetchLatestBlogs = async ({ page = 1 }) => {
		const blogsRef = collection(db, "blogs");
		let q = query(
			blogsRef,
			where("draft", "==", false),
			orderBy("publishedAt", "desc"),
			limit(5)
		);

		if (blogs?.lastVisible) {
			q = query(q, startAfter(blogs.lastVisible));
		}

		try {
			const querySnapshot = await getDocs(q);
			const fetchedBlogs = querySnapshot.docs.map((doc) => ({
				id: doc.id,
				...doc.data(),
			}));

			const lastVisible = querySnapshot.docs[querySnapshot.docs.length - 1];
			const hasMore = querySnapshot.docs.length === 5;

			setBlogs((prevBlogs) => ({
				results: prevBlogs
					? [...prevBlogs.results, ...fetchedBlogs]
					: fetchedBlogs,
				page,
				lastVisible,
				hasMore,
			}));
		} catch (error) {
			console.error("Error fetching blogs: ", error);
		}
	};

	const fetchTrendingBlogs = async () => {
		const blogsRef = collection(db, "blogs");
		const q = query(
			blogsRef,
			where("draft", "==", false),
			orderBy("activity.total_reads", "desc"),
			limit(5)
		);

		try {
			const querySnapshot = await getDocs(q);
			const fetchedBlogs = querySnapshot.docs.map((doc) => ({
				id: doc.id,
				...doc.data(),
			}));
			setTrendingBlogs(fetchedBlogs);
		} catch (error) {
			console.error("Error fetching trending blogs: ", error);
		}
	};

	const fetchBlogByCategory = async ({ page = 1 }) => {
		const blogsRef = collection(db, "blogs");
		let q = query(
			blogsRef,
			where("draft", "==", false),
			where("tags", "array-contains", pageState),
			orderBy("publishedAt", "desc"),
			limit(5)
		);

		if (blogs?.lastVisible) {
			q = query(q, startAfter(blogs.lastVisible));
		}

		try {
			const querySnapshot = await getDocs(q);
			const fetchedBlogs = querySnapshot.docs.map((doc) => ({
				id: doc.id,
				...doc.data(),
			}));

			const lastVisible = querySnapshot.docs[querySnapshot.docs.length - 1];
			const hasMore = querySnapshot.docs.length === 5;

			setBlogs((prevBlogs) => ({
				results: prevBlogs
					? [...prevBlogs.results, ...fetchedBlogs]
					: fetchedBlogs,
				page,
				lastVisible,
				hasMore,
			}));
		} catch (error) {
			console.error("Error fetching blogs by category: ", error);
		}
	};

	useEffect(() => {
		activeTabRef.current.click();

		if (pageState === "home") {
			fetchLatestBlogs({ page: 1 });
		} else {
			fetchBlogByCategory({ page: 1 });
		}

		if (!trendingBlogs) {
			fetchTrendingBlogs();
		}
	}, [pageState]);

	const loadBlogByCategory = (e) => {
		let category = e.target.innerText.toLowerCase();
		setBlogs(null);

		if (pageState === category) {
			setPageState("home");
			return;
		}

		setPageState(category);
	};

	return (
		<AnimationWrapper>
			<section className="h-cover flex justify-center gap-10">
				<div className="w-full">
					<InpageNavigation
						routes={[pageState, "Trending"]}
						defaultHidden={["Trending"]}
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
								<NoDataMessage message="No post available" />
							)}
							{blogs && blogs.hasMore && (
								<LoadMoreDataBtn
									state={blogs}
									fetchDataFun={
										pageState === "home"
											? fetchLatestBlogs
											: fetchBlogByCategory
									}
									additionalParam={{ page: blogs ? blogs.page + 1 : 1 }}
								/>
							)}
						</>

						{trendingBlogs === null ? (
							<Loader />
						) : trendingBlogs.length ? (
							trendingBlogs.map((blog, i) => (
								<AnimationWrapper
									key={i}
									transition={{ duration: 1, delay: i * 0.1 }}
								>
									<MinimalBlogPost blog={blog} index={i} />
								</AnimationWrapper>
							))
						) : (
							<NoDataMessage message="No trending blog" />
						)}
					</InpageNavigation>
				</div>

				<div className="min-w-[40%] lg:min-w-[400px] max-w-min border-l border-grey pl-8 pt-3 max-md:hidden">
					<div className="flex flex-col gap-10">
						<div>
							<h1 className="font-medium text-xl mb-8">
								Interesting stories...
							</h1>

							<div className="flex gap-3 flex-wrap">
								{categories.map((category, i) => (
									<button
										className={
											"tag" +
											(pageState === category ? " bg-black text-white " : " ")
										}
										key={i}
										onClick={loadBlogByCategory}
									>
										{category}
									</button>
								))}
							</div>
						</div>

						<div>
							<h1 className="font-medium text-xl mb-8">
								Trending <i className="fi fi-rr-arrow-trend-up"></i>
							</h1>

							{trendingBlogs === null ? (
								<Loader />
							) : trendingBlogs.length ? (
								trendingBlogs.map((blog, i) => (
									<AnimationWrapper
										key={i}
										transition={{ duration: 1, delay: i * 0.1 }}
									>
										<MinimalBlogPost blog={blog} index={i} />
									</AnimationWrapper>
								))
							) : (
								<NoDataMessage message="No post available" />
							)}
						</div>
					</div>
				</div>
			</section>
		</AnimationWrapper>
	);
};

export default HomePage;
