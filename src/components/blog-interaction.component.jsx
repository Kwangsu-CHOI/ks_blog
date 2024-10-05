import { useContext, useEffect } from "react";
import { BlogContext } from "../pages/blog.page";
import { Link } from "react-router-dom";
import { Toaster, toast } from "react-hot-toast";
import {
	doc,
	updateDoc,
	increment,
	arrayUnion,
	arrayRemove,
	getDoc,
} from "firebase/firestore";
import { db, auth } from "../firebase/firebase";
import { likeBlog, unlikeBlog } from "../firebase/firestore-operations";
import { useRecoilState } from "recoil";
import { userAuthState } from "../recoil/atoms";

const BlogInteraction = () => {
	const {
		blog,
		blog: {
			id,
			title,
			activity,
			activity: { total_likes = 0, total_comments = 0 } = {},
			author: { personal_info: { username: author_username } = {} } = {},
		} = {},
		setBlog,
		isLikedByUser,
		setIsLikedByUser,
		setCommentsWrapper,
	} = useContext(BlogContext);

	const [userAuth, setUserAuth] = useRecoilState(userAuthState);

	const username = userAuth?.personal_info?.username || "";

	useEffect(() => {
		if (auth.currentUser || userAuth) {
			const checkLikeStatus = async () => {
				const userRef = doc(db, "users", auth.currentUser.uid || userAuth.id);
				const userSnap = await getDoc(userRef);
				if (userSnap.exists()) {
					const userData = userSnap.data();
					setIsLikedByUser(userData.likedBlogs?.includes(id) || false);
				}
			};
			checkLikeStatus();
		}
	}, [id, setIsLikedByUser]);

	const handleLike = async () => {
		if (!auth.currentUser) {
			return toast.error("Please login to like this blog!");
		}

		try {
			if (isLikedByUser) {
				await unlikeBlog(id, auth.currentUser.uid || userAuth.id);
				setIsLikedByUser(false);
				setBlog({
					...blog,
					activity: {
						...activity,
						total_likes: total_likes - 1,
					},
				});
			} else {
				await likeBlog(id, auth.currentUser.uid || userAuth.id);
				setIsLikedByUser(true);
				setBlog({
					...blog,
					activity: {
						...activity,
						total_likes: total_likes + 1,
					},
				});
			}

			// 사용자 정보 업데이트
			if (userAuth) {
				const updatedUserAuth = {
					...userAuth,
					likedBlogs: isLikedByUser
						? userAuth.likedBlogs.filter((blogId) => blogId !== id)
						: [...(userAuth.likedBlogs || []), id],
				};
				setUserAuth(updatedUserAuth);
			}
		} catch (err) {
			console.error(err);
			toast.error("Failed to update like");
		}
	};

	return (
		<>
			<Toaster />
			<hr className="border-grey my-2" />
			<div className="flex gap-6 justify-between">
				<div className="flex gap-3 items-center">
					<button
						className={`w-10 h-10 rounded-full flex items-center justify-center ${
							isLikedByUser ? "bg-red/20 text-red" : "bg-grey/80"
						}`}
						onClick={handleLike}
					>
						<i className="fi fi-rr-heart"></i>
					</button>
					<p className="text-xl text-dark-grey">{total_likes}</p>

					<button
						className="w-10 h-10 rounded-full flex items-center justify-center bg-grey/80"
						onClick={() => {
							if (blog && blog.id) {
								setCommentsWrapper((prev) => !prev);
							} else {
								console.error("Blog or blog ID is undefined");
							}
						}}
					>
						<i className="fi fi-rr-comment-dots"></i>
					</button>
					<p className="text-xl text-dark-grey">{total_comments}</p>
				</div>

				<div className="flex gap-6 items-center">
					{username === author_username ? (
						<Link to={`/editor/${id}`} className="underline hover:text-purple">
							Edit
						</Link>
					) : null}

					<Link
						to={`https://twitter.com/intent/tweet?text=Read ${title}&url=${location.href}`}
					>
						<i className="fi fi-brands-twitter text-xl hover:text-twitter"></i>
					</Link>
				</div>
			</div>
			<hr className="border-grey my-2" />
		</>
	);
};

export default BlogInteraction;
