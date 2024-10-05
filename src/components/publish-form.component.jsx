import React, { useContext, useEffect, useState } from "react";
import AnimationWrapper from "../common/page-animation";
import { Toaster, toast } from "react-hot-toast";
import { EditorContext } from "../pages/editor.pages";
import Tag from "./tags.component";
import { useNavigate, useParams } from "react-router-dom";
import { db, auth } from "../firebase/firebase";
import {
	doc,
	setDoc,
	serverTimestamp,
	updateDoc,
	increment,
} from "firebase/firestore";
import { getUser } from "../firebase/firestore-operations";
import { useRecoilState } from "recoil";
import { userAuthState } from "../recoil/atoms";

const PublishForm = () => {
	const characterLimit = 200;
	const tagLimit = 10;
	const { blog_id } = useParams();
	const navigate = useNavigate();

	const { blog, setBlog, setEditorState, setTextEditor } =
		useContext(EditorContext);
	const [userAuth, setUserAuth] = useRecoilState(userAuthState);

	const [charLeft, setCharLeft] = useState(characterLimit);

	useEffect(() => {
		if (!blog) {
			setEditorState("editor");
		}
	}, [blog, setEditorState]);

	useEffect(() => {
		if (!userAuth.username && auth.currentUser) {
			getUser(auth.currentUser.uid).then((userData) => {
				if (userData) {
					setUserAuth((prevAuth) => ({
						...prevAuth,
						username: userData.personal_info.username,
					}));
				}
			});
		}
	}, [userAuth, auth.currentUser, setUserAuth]);

	if (!blog) {
		return null;
	}

	const { banner, title, tags, des, content } = blog;

	const handleCloseEvent = () => {
		setEditorState("editor");
		setTextEditor({ isReady: false });
	};

	const handleBlogTitleChange = (e) => {
		const newTitle = e.target.value;
		setBlog({ ...blog, title: newTitle });
	};

	const handleBlogDesChange = (e) => {
		const newDes = e.target.value;
		setCharLeft(characterLimit - newDes.length);
		setBlog({ ...blog, des: newDes });
	};

	const handleTitleKeyDown = (e) => {
		if (e.key === "Enter") {
			e.preventDefault();
		}
	};

	const handleKeyDown = (e) => {
		if (e.key === "Enter" || e.key === ",") {
			e.preventDefault();
			const tag = e.target.value.trim();
			if (tag.length && !tags.includes(tag) && tags.length < tagLimit) {
				setBlog({ ...blog, tags: [...tags, tag] });
				e.target.value = "";
			}
		}
	};

	const handleTagDelete = (tagToDelete) => {
		const updatedTags = tags.filter((t) => t !== tagToDelete);
		setBlog({ ...blog, tags: updatedTags });
	};

	const publishBlog = async (isDraft = false) => {
		if (!title.length) {
			return toast.error(
				isDraft
					? "Please provide a title before saving"
					: "Please provide a title to publish"
			);
		}
		if (!isDraft && (!des.length || des.length > characterLimit)) {
			return toast.error(
				`Please provide a description within ${characterLimit} characters to publish`
			);
		}
		if (!isDraft && !tags.length) {
			return toast.error("Please add at least one tag to publish");
		}

		const loadingToast = toast.loading(
			isDraft ? "Saving as draft..." : "Publishing..."
		);

		const blogId = blog_id || Date.now().toString();

		const blogObj = {
			title,
			banner: banner,
			des,
			content,
			tags,
			draft: isDraft,
			publishedAt: serverTimestamp(),
			author: {
				personal_info: {
					fullname:
						auth.currentUser?.displayName || userAuth.personal_info.fullname,
					username:
						userAuth?.personal_info.username ||
						auth.currentUser?.email?.split("@")[0],
					profile_img:
						auth.currentUser?.photoURL || userAuth.personal_info.profile_img,
				},
				id: auth.currentUser?.uid || userAuth.id,
			},
		};

		try {
			await setDoc(doc(db, "blogs", blogId), blogObj);

			// 사용자의 블로그 카운트 증가
			const userRef = doc(db, "users", auth.currentUser.uid || userAuth.id);
			await updateDoc(userRef, {
				"account_info.total_posts": increment(1),
				"personal_info.total_posts": increment(1),
			});

			// 사용자 정보 업데이트
			if (userAuth) {
				const updatedUserAuth = {
					...userAuth,
					account_info: {
						...userAuth.account_info,
						total_posts: (userAuth.account_info?.total_posts || 0) + 1,
					},
					personal_info: {
						...userAuth.personal_info,
						total_posts: (userAuth.personal_info?.total_posts || 0) + 1,
					},
				};
				setUserAuth(updatedUserAuth);
			}

			toast.dismiss(loadingToast);
			toast.success(isDraft ? "Saved as draft" : "Published successfully");

			setTimeout(() => {
				navigate("/blog/" + blogId);
			}, 1000);
		} catch (error) {
			toast.dismiss(loadingToast);
			toast.error(error.message);
		}
	};

	useEffect(() => {
		console.log(blog);
	}, []);

	return (
		<AnimationWrapper>
			<section className="w-screen min-h-screen grid items-center lg:grid-cols-2 py-16 lg:gap-4">
				<Toaster />
				<button
					className="w-12 h-12 absolute right-[5vw] z-10 top-[5%] lg:top-[10%]"
					onClick={handleCloseEvent}
				>
					<i className="fi fi-br-cross"></i>
				</button>

				<div className="max-w-[550px] center">
					<p className="text-dark-grey mb-1">Preview</p>
					<div className="w-full aspect-video rounded-lg overflow-hidden bg-grey mt-4">
						<img src={banner} alt="Blog banner" />
					</div>
					<h1 className="text-4xl font-medium mt-2 leading-tight line-clamp-2">
						{title}
					</h1>
					<p className="font-gelasio line-clamp-2 text-xl leading-7 mt-4">
						{des}
					</p>
				</div>

				<div className="border-grey lg:border-1 lg:pl-8">
					<p className="text-dark-grey mb-2 mt-9">Blog Title</p>
					<input
						className="input-box pl-4"
						type="text"
						placeholder="Blog Title"
						value={title}
						onChange={handleBlogTitleChange}
						onKeyDown={handleTitleKeyDown}
					/>

					<p className="text-dark-grey mb-2 mt-9">Short description</p>
					<textarea
						maxLength={characterLimit}
						value={des}
						className="h-40 resize-none leading-7 input-box pl-4"
						onChange={handleBlogDesChange}
					></textarea>
					<p className="mt-1 text-dark-grey text-sm text-right">
						{charLeft} characters left
					</p>

					<p className="text-dark-grey mb-2 mt-9">
						Tags - (helps in searching and ranking your blog post)
					</p>

					<div className="relative input-box pl-2 py-2 pb-4">
						<input
							type="text"
							placeholder="Press enter or comma to add tags"
							className="sticky input-box bg-white top-0 left-0 pl-4 mb-3 focus:bg-white"
							onKeyDown={handleKeyDown}
						/>
						{tags.map((tag, i) => (
							<Tag
								key={i}
								tag={tag}
								tagIndex={i}
								handleTagDelete={handleTagDelete}
							/>
						))}
					</div>
					<p className="mt-1 mb-4 text-dark-grey text-right">
						{tagLimit - tags.length} Tags left
					</p>

					<div className="flex gap-4 mt-8">
						<button
							className="btn-dark px-8"
							onClick={() => publishBlog(false)}
						>
							Publish
						</button>
						<button
							className="btn-light px-8"
							onClick={() => publishBlog(true)}
						>
							Save as Draft
						</button>
					</div>
				</div>
			</section>
		</AnimationWrapper>
	);
};

export default PublishForm;
