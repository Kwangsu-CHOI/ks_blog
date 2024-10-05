import React, { createContext, useContext, useState, useEffect } from "react";
import { Navigate, useParams } from "react-router-dom";
import BlogEditor from "../components/blog-editor.component";
import PublishForm from "../components/publish-form.component";
import Loader from "../components/loader.component";
import { doc, getDoc } from "firebase/firestore";
import { db, auth } from "../firebase/firebase";
import { useRecoilValue } from "recoil";
import { userAuthState } from "../recoil/atoms";

export const EditorContext = createContext({});

const blogStructure = {
	title: "",
	banner: "",
	content: [],
	tags: [],
	des: "",
	author: { personal_info: {} },
};

const Editor = () => {
	let { blog_id } = useParams();

	const [blog, setBlog] = useState(blogStructure);
	const [editorState, setEditorState] = useState("editor");
	const [textEditor, setTextEditor] = useState({ isReady: false });
	const [loading, setLoading] = useState(true);

	const userAuth = useRecoilValue(userAuthState);

	useEffect(() => {
		if (!blog_id) {
			setLoading(false);
			return;
		}

		const fetchBlog = async () => {
			try {
				const blogRef = doc(db, "blogs", blog_id);
				const blogSnap = await getDoc(blogRef);

				if (blogSnap.exists()) {
					setBlog({ id: blogSnap.id, ...blogSnap.data() });
				} else {
					console.log("No such blog!");
				}
			} catch (error) {
				console.error("Error fetching blog: ", error);
			} finally {
				setLoading(false);
			}
		};

		fetchBlog();
	}, [blog_id]);

	return (
		<EditorContext.Provider
			value={{
				blog,
				setBlog,
				editorState,
				setEditorState,
				textEditor,
				setTextEditor,
			}}
		>
			{!auth.currentUser ? (
				<Navigate to="/signin" />
			) : loading ? (
				<Loader />
			) : editorState === "editor" ? (
				<BlogEditor />
			) : (
				<PublishForm />
			)}
		</EditorContext.Provider>
	);
};

export default Editor;
