import React, { useContext, useEffect, useState } from "react";
import {
	collection,
	query as firebaseQuery,
	where,
	getDocs,
	orderBy,
	limit,
	startAfter,
} from "firebase/firestore";
import { db } from "../firebase/firebase";
import AnimationWrapper from "../common/page-animation";
import { Toaster } from "react-hot-toast";
import InpageNavigation from "../components/inpage-navigation.component";
import Loader from "../components/loader.component";
import NoDataMessage from "../components/nodata.component";
import {
	ManagePublishedBlogCard,
	ManageDraftBlogPost,
} from "../components/manage-blogcard.component";
import LoadMoreDataBtn from "../components/load-more.component";
import { useSearchParams } from "react-router-dom";
import { useRecoilValue } from "recoil";
import { isAuthLoadingState, userAuthState } from "../recoil/atoms";

const ManageBlogs = () => {
	const [blogs, setBlogs] = useState({ results: [], lastVisible: null });
	const [drafts, setDrafts] = useState({ results: [], lastVisible: null });
	const [searchQuery, setSearchQuery] = useState("");
	const [loading, setLoading] = useState(true);
	const [query, setQuery] = useState("");

	const userAuth = useRecoilValue(userAuthState);
	const isAuthLoading = useRecoilValue(isAuthLoadingState);

	let activeTab = useSearchParams()[0].get("tab");

	const fetchBlogs = async (isDraft, lastVisible = null) => {
		if (!userAuth) return;

		setLoading(true);
		const blogsRef = collection(db, "blogs");
		let q = firebaseQuery(
			blogsRef,
			where("draft", "==", isDraft),
			where("author.id", "==", userAuth.id),
			orderBy("publishedAt", "desc"),
			limit(5)
		);

		if (userAuth.username) {
			q = firebaseQuery(
				q,
				where("author.personal_info.username", "==", userAuth.username)
			);
		}

		if (lastVisible) {
			q = firebaseQuery(q, startAfter(lastVisible));
		}

		try {
			const querySnapshot = await getDocs(q);
			const fetchedBlogs = querySnapshot.docs.map((doc) => ({
				id: doc.id,
				...doc.data(),
			}));

			const newLastVisible = querySnapshot.docs[querySnapshot.docs.length - 1];

			if (isDraft) {
				setDrafts((prev) => ({
					results: [...prev.results, ...fetchedBlogs],
					lastVisible: newLastVisible,
				}));
			} else {
				setBlogs((prev) => ({
					results: [...prev.results, ...fetchedBlogs],
					lastVisible: newLastVisible,
				}));
			}
		} catch (error) {
			console.error("Error fetching blogs: ", error);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		if (!isAuthLoading && userAuth) {
			fetchBlogs(false);
			fetchBlogs(true);
		}
	}, [userAuth, isAuthLoading]);

	const handleSearch = (e) => {
		if (e.key === "Enter") {
			// 검색 시 필터링만 수행하고 새로운 데이터를 가져오지 않음
			setSearchQuery(e.target.value);
		}
	};

	const handleChange = (e) => {
		setSearchQuery(e.target.value);
	};

	const filterBlogs = (blogArray) => {
		if (!searchQuery) return blogArray;
		return blogArray.filter(
			(blog) =>
				blog.title.toLowerCase().includes(searchQuery) ||
				blog.des.toLowerCase().includes(searchQuery) ||
				blog.tags.some((tag) => tag.toLowerCase().includes(searchQuery))
		);
	};

	const loadMore = (isDraft) => {
		const lastVisible = isDraft ? drafts.lastVisible : blogs.lastVisible;
		fetchBlogs(isDraft, lastVisible);
	};

	const filteredBlogs = filterBlogs(blogs.results);
	const filteredDrafts = filterBlogs(drafts.results);

	return (
		<>
			<h1 className="max-md:hidden">Manage Blogs</h1>
			<Toaster />
			<div className="relative max-md:mt-5 md:mt-8 mb-10">
				<input
					type="search"
					className="w-full bg-grey p-4 pl-12 pr-6 rounded-full placeholder:text-dark-grey"
					placeholder="Search Blogs"
					onChange={handleChange}
					onKeyDown={handleSearch}
				/>
				<i className="fi fi-rr-search absolute right-[10%] md:pointer-events-none md:left-5 top-1/2 -translate-y-1/2 text-xl text-dark-grey"></i>
			</div>

			<InpageNavigation
				routes={["Published", "Drafts"]}
				defaultActiveIndex={activeTab != "draft" ? 0 : 1}
			>
				{/* blog part */}
				{blogs == null ? (
					<Loader />
				) : filteredBlogs.length ? (
					<>
						{filteredBlogs.map((blog, i) => {
							return (
								<AnimationWrapper key={i} transition={{ delay: i * 0.04 }}>
									<ManagePublishedBlogCard
										blog={{ ...blog, index: i, setStateFunc: setBlogs }}
									/>
								</AnimationWrapper>
							);
						})}

						{blogs.lastVisible && filteredBlogs.length >= 5 && (
							<LoadMoreDataBtn
								state={blogs}
								fetchDataFun={() => loadMore(false)}
								additionalParam={{
									draft: false,
								}}
							/>
						)}
					</>
				) : (
					<NoDataMessage message="No published blog available" />
				)}

				{/* draft part */}
				{drafts == null ? (
					<Loader />
				) : filteredDrafts.length ? (
					<>
						{filteredDrafts.map((blog, i) => {
							return (
								<AnimationWrapper key={i} transition={{ delay: i * 0.04 }}>
									<ManageDraftBlogPost
										blog={{ ...blog, index: i, setStateFunc: setDrafts }}
									/>
								</AnimationWrapper>
							);
						})}

						{drafts.lastVisible && filteredDrafts.length >= 5 && (
							<LoadMoreDataBtn
								state={drafts}
								fetchDataFun={() => loadMore(true)}
								additionalParam={{
									draft: true,
								}}
							/>
						)}
					</>
				) : (
					<NoDataMessage message="검색 결과가 없습니다." />
				)}
			</InpageNavigation>
		</>
	);
};

export default ManageBlogs;
