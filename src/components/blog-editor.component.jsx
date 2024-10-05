import React, { useContext, useEffect, useRef } from "react";
import { tools as editorTools } from "./tools.component";
import { EditorContext } from "../pages/editor.pages";
import { Link, useNavigate } from "react-router-dom";
import logo from "../imgs/logo-light.png";
import AnimationWrapper from "../common/page-animation";
import defaultBanner from "../imgs/blog banner.png";
import { uploadImage } from "../firebase/firestore-operations";
import { Toaster, toast } from "react-hot-toast";
import EditorJS from "@editorjs/editorjs";
import { tools } from "./tools.component";
import { auth, db } from "../firebase/firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { useRecoilValue } from "recoil";
import { userAuthState } from "../recoil/atoms";

const BlogEditor = () => {
	const {
		blog,
		blog: { title, banner, content },
		setBlog,
		textEditor,
		setTextEditor,
		setEditorState,
	} = useContext(EditorContext);

	const editorRef = useRef(null);
	const navigate = useNavigate();
	const userAuth = useRecoilValue(userAuthState);

	const defaultBanners = [
		"https://firebasestorage.googleapis.com/v0/b/blog-65bcd.appspot.com/o/default-blog-banner1.png?alt=media&token=86fc2c4b-ce11-4c0d-9b0d-78eb5eed5ba0",
		"https://firebasestorage.googleapis.com/v0/b/blog-65bcd.appspot.com/o/default-blog-banner2.png?alt=media&token=af306d43-b739-449a-ae78-fa34d27ba0ca",
		"https://firebasestorage.googleapis.com/v0/b/blog-65bcd.appspot.com/o/default-blog-banner3.png?alt=media&token=6eb4ec8a-948d-4a4a-b0b1-44a0a8d72bcf",
	];

	const getRandomDefaultBanner = () => {
		return defaultBanners[Math.floor(Math.random() * defaultBanners.length)];
	};

	useEffect(() => {
		if (!textEditor.isReady) {
			const editor = new EditorJS({
				holder: "textEditor",
				data: content,
				tools: editorTools(userAuth),
				placeholder: "Let's write an awesome story",
				onChange: async () => {
					const content = await editor.save();
					setBlog((prevBlog) => ({ ...prevBlog, content }));
				},
			});

			editor.isReady
				.then(() => {
					editorRef.current = editor;
					setTextEditor({ isReady: true, editor: editor });
				})
				.catch((error) => {
					console.log("Editor.js initialization failed:", error);
				});
		}
	}, []);

	const handleBannerUpload = (e) => {
		let img = e.target.files[0];
		if (img) {
			let loadingToast = toast.loading("Uploading...");
			const path = `blog_banners/${auth.currentUser.uid}/${Date.now()}_${
				img.name
			}`;
			uploadImage(img, path)
				.then((url) => {
					if (url) {
						setBlog({ ...blog, banner: url });
						toast.dismiss(loadingToast);
						toast.success("Banner uploaded successfully");
					}
				})
				.catch((err) => {
					toast.dismiss(loadingToast);
					toast.error(err.message);
				});
		}
	};

	const handleTitleKeyDown = (e) => {
		if (e.keyCode === 13) {
			e.preventDefault();
		}
	};

	const handleTitleChange = (e) => {
		let input = e.target;
		input.style.height = "auto";
		input.style.height = input.scrollHeight + "px";
		setBlog({ ...blog, title: input.value });
	};

	const handlePublishEvent = () => {
		let updatedBlog = { ...blog };

		if (!banner || banner === defaultBanner) {
			const randomBanner = getRandomDefaultBanner();
			updatedBlog.banner = randomBanner;
			toast.success("Banner is not uploaded, so we picked one for you 😁");
		}

		if (!title.length) {
			return toast.error("Write blog title to publish it");
		}
		if (editorRef.current) {
			editorRef.current
				.save()
				.then((data) => {
					if (data.blocks.length) {
						updatedBlog.content = data;
						setBlog(updatedBlog);
						setEditorState("publish");
					} else {
						return toast.error("Write something in your blog to publish it");
					}
				})
				.catch((err) => {
					console.log(err);
				});
		}
	};

	const handleSaveDraft = async () => {
		if (!title.length) {
			return toast.error("Please write a title for your blog.");
		}

		let updatedBlog = { ...blog };

		if (!banner || banner === defaultBanner) {
			const randomBanner = getRandomDefaultBanner();
			updatedBlog.banner = randomBanner;
		}

		const loadingToast = toast.loading("Saving draft...");

		const blogId = blog.blog_id || Date.now().toString();

		if (editorRef.current) {
			try {
				const content = await editorRef.current.save();
				updatedBlog.content = content;

				const blogObj = {
					...updatedBlog,
					title,
					banner: updatedBlog.banner,
					tags: [],
					des: "",
					draft: true,
					publishedAt: serverTimestamp(),
					author: {
						personal_info: {
							fullname:
								auth.currentUser?.displayName ||
								userAuth.personal_info.fullname,
							username:
								userAuth?.personal_info.username ||
								auth.currentUser?.email?.split("@")[0],
							profile_img:
								auth.currentUser?.photoURL ||
								userAuth.personal_info.profile_img,
						},
						id: auth.currentUser?.uid || userAuth.id,
					},
				};

				await setDoc(doc(db, "blogs", blogId), blogObj);

				toast.dismiss(loadingToast);
				toast.success("Draft saved successfully.");

				setTimeout(() => {
					navigate("/");
				}, 500);
			} catch (err) {
				console.log(err);
				toast.dismiss(loadingToast);
				toast.error("Failed to save draft.");
			}
		}
	};

	return (
		<>
			<Toaster />
			<nav className="navbar">
				<Link to="/" className="flex-none w-10">
					<img src={logo} alt="logo" />
				</Link>
				<p className="max-md:hidden text-black line-clamp-1 w-full">
					{title.length ? title : "New Blog"}
				</p>
				<div className="flex gap-4 ml-auto">
					<button className="btn-dark py-2" onClick={handlePublishEvent}>
						Publish
					</button>
					<button className="btn-light py-2" onClick={handleSaveDraft}>
						Save Draft
					</button>
				</div>
			</nav>
			<AnimationWrapper>
				<section>
					<div className="mx-auto max-w-[900px] w-full">
						<div className="relative aspect-video hover:opacity-80 bg-white border-4 border-grey">
							<label htmlFor="uploadBanner">
								<img
									src={banner || defaultBanner}
									className="z-20"
									alt="blog banner"
								/>
								<input
									id="uploadBanner"
									type="file"
									accept=".png, .jpg, .jpeg"
									hidden
									onChange={handleBannerUpload}
								/>
							</label>
						</div>
						<textarea
							defaultValue={title}
							placeholder="Blog Title"
							className="text-4xl font-medium w-full h-20 outline-none resize-none mt-10 leading-tight placeholder:opacity-40 bg-white"
							onKeyDown={handleTitleKeyDown}
							onChange={handleTitleChange}
						></textarea>
						<hr className="w-full opacity-10 my-5" />
						<div id="textEditor" className="font-gelasio"></div>
					</div>
				</section>
			</AnimationWrapper>
		</>
	);
};

export default BlogEditor;
