import React, { useContext, useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
	doc,
	getDoc,
	updateDoc,
	increment,
	collection,
	query,
	where,
	getDocs,
	limit,
} from "firebase/firestore";
import { db, auth } from "../firebase/firebase";
import AnimationWrapper from "../common/page-animation";
import Loader from "../components/loader.component";
import BlogInteraction from "../components/blog-interaction.component";
import BlogPostCard from "../components/blog-post.component";
import CommentsContainer, {
	fetchComments,
} from "../components/comments.component";
import { getDay } from "../common/date";
import BlogContent from "../components/blog-content.component";
import { useRecoilValue } from "recoil";
import { userAuthState } from "../recoil/atoms";

export const BlogContext = React.createContext({});

const BlogPage = () => {
	const { blog_id } = useParams();
	const userAuth = useRecoilValue(userAuthState);
	const [blog, setBlog] = useState({
		id: null,
		title: "",
		comments: { results: [] },
		activity: { total_comments: 0, total_parent_comments: 0, total_likes: 0 },
		author: { personal_info: {} },
	});
	const [loading, setLoading] = useState(true);
	const [isLikedByUser, setIsLikedByUser] = useState(false);
	const [commentsWrapper, setCommentsWrapper] = useState(false);
	const [totalParentCommentsLoaded, setTotalParentCommentsLoaded] = useState(0);
	const [similarBlogs, setSimilarBlogs] = useState(null);

	useEffect(() => {
		if (!blog.id || blog.id !== blog_id) {
			const blogCache = new Map();

			const fetchBlog = async () => {
				if (blogCache.has(blog_id)) {
					setBlog(blogCache.get(blog_id));
					return;
				}

				setLoading(true);
				try {
					const blogRef = doc(db, "blogs", blog_id);
					const blogSnap = await getDoc(blogRef);

					if (blogSnap.exists()) {
						const blogData = blogSnap.data();
						const comments = await fetchComments({
							blog_id: blog_id,
							setParentCommentCountFun: setTotalParentCommentsLoaded,
						});
						setBlog({
							id: blogSnap.id,
							...blogData,
							publishedAt: blogData.publishedAt.toDate(),
							comments: { results: comments },
							activity: blogData.activity || {
								total_comments: 0,
								total_parent_comments: 0,
								total_likes: 0,
							},
							author: {
								...blogData.author,
								personal_info: {
									...blogData.author.personal_info,
									profile_img:
										blogData.author.personal_info.profile_img ||
										"/default-profile-image.png",
								},
							},
						});

						if (auth.currentUser || userAuth) {
							const userRef = doc(
								db,
								"users",
								auth.currentUser?.uid || userAuth.id
							);
							const userSnap = await getDoc(userRef);
							if (userSnap.exists()) {
								const userData = userSnap.data();
								setIsLikedByUser(
									userData.likedBlogs?.includes(blog_id) || false
								);
							}
						}

						// Increment total_reads
						await updateDoc(blogRef, {
							"activity.total_reads": increment(1),
						});

						// Increment total_reads for author
						const authorRef = doc(db, "users", blogData.author.id);
						await updateDoc(authorRef, {
							"account_info.total_reads": increment(1),
						});

						// Fetch similar blogs
						const blogsRef = collection(db, "blogs");
						const q = query(
							blogsRef,
							where("tags", "array-contains-any", blogData.tags),
							where("blog_id", "!=", blog_id),
							limit(3)
						);
						const querySnapshot = await getDocs(q);
						setSimilarBlogs(
							querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
						);

						// Check if the blog is liked by the user
						if (auth.currentUser || userAuth) {
							const userRef = doc(
								db,
								"users",
								auth.currentUser.uid || userAuth.id
							);
							const userSnap = await getDoc(userRef);
							if (userSnap.exists()) {
								const userData = userSnap.data();
								setIsLikedByUser(
									userData.likedBlogs?.includes(blog_id) || false
								);
							}
						}

						blogCache.set(blog_id, blogData);
					} else {
						setBlog(null);
					}
					setLoading(false);
				} catch (error) {
					console.error("Error fetching blog: ", error);
					setBlog(null);
				} finally {
					setLoading(false);
				}
			};

			fetchBlog();
		}
	}, [blog_id, userAuth]);

	return (
		<AnimationWrapper>
			<BlogContext.Provider
				value={{
					blog,
					setBlog,
					isLikedByUser,
					setIsLikedByUser,
					commentsWrapper,
					setCommentsWrapper,
					totalParentCommentsLoaded,
					setTotalParentCommentsLoaded,
					userAuth,
				}}
			>
				{loading ? (
					<Loader />
				) : blog ? (
					<>
						<CommentsContainer />
						<div className="max-w-[900px] center py-10 max-lg:px-[5vw]">
							<img
								src={blog.banner}
								className="aspect-video"
								alt="Blog Banner"
							/>
							<div className="mt-12">
								<h2>{blog.title}</h2>
								<div className="flex max-sm:flex-col justify-between my-8">
									<div className="flex gap-5 items-start">
										<img
											src={blog.author.personal_info.profile_img}
											className="w-12 h-12 rounded-full"
											alt="Author"
										/>
										<p className="capitalize">
											{blog.author.personal_info.fullname}
											<br />@{blog.author.personal_info.username}
										</p>
									</div>
									<p className="text-dark-grey opacity-75 max-sm:mt-6 max-sm:ml-12 max-sm:pl-5">
										Published on {getDay(blog.publishedAt)}
									</p>
								</div>
							</div>
							<BlogInteraction />
							<div className="my-12 font-gelasio blog-page-content">
								{blog.content.blocks.map((block, i) => (
									<BlogContent key={i} block={block} />
								))}
							</div>
							<BlogInteraction />
							{similarBlogs && similarBlogs.length > 0 && (
								<>
									<h1 className="text-2xl mt-14 mb-10 font-medium">
										Similar Blogs
									</h1>
									{similarBlogs.map((blog, i) => (
										<AnimationWrapper
											key={i}
											transition={{ duration: 1, delay: i * 0.08 }}
										>
											<BlogPostCard
												content={blog}
												author={blog.author.personal_info}
											/>
										</AnimationWrapper>
									))}
								</>
							)}
						</div>
					</>
				) : (
					<div className="h-cover flex flex-col items-center justify-center">
						<h1 className="text-4xl font-gelasio">Blog not found</h1>
						<h1 className="text-3xl font-gelasio">or please sign in first to read this post.</h1>
						<Link to="/" className="text-xl mt-4 underline text-blue-500">
							Go to Home
						</Link>
					</div>
				)}
			</BlogContext.Provider>
		</AnimationWrapper>
	);
};

export default BlogPage;
