import { useContext, useState } from "react";
import { BlogContext } from "../pages/blog.page";
import { addComment } from "../firebase/firestore-operations";
import { auth } from "../firebase/firebase";
import { toast } from "react-hot-toast";
import { useRecoilValue } from "recoil";
import { userAuthState } from "../recoil/atoms";

const CommentField = ({
	action,
	replyingTo,
	setReplying,
	onSubmit,
	setCommentUpdateTrigger,
}) => {
	const [comment, setComment] = useState("");
	const { blog, setBlog } = useContext(BlogContext);
	const userAuth = useRecoilValue(userAuthState);

	const handleSubmit = async (e) => {
		e.preventDefault();
		if (!comment.length) {
			return toast.error("Please write something to comment");
		}
		if (!auth.currentUser || !userAuth) {
			return toast.error("Please login to comment");
		}

		const commentObj = {
			blog_id: blog.id,
			blog_author: blog.author.personal_info.username,
			comment,
			parent: replyingTo ? replyingTo : null,
			isReply: !!replyingTo,
			commentedBy: auth.currentUser.uid,
		};

		try {
			const newComment = await onSubmit(comment, replyingTo);
			setComment("");
			if (setReplying) {
				setReplying(false);
			}
		} catch (error) {
			console.error("Error adding comment: ", error);
			toast.error("Failed to add comment");
		}
	};

	return (
		<form onSubmit={handleSubmit}>
			<textarea
				value={comment}
				onChange={(e) => setComment(e.target.value)}
				placeholder={`Write a ${action}...`}
				className="input-box pl-5 placeholder:text-dark-grey resize-none h-[150px] overflow-auto"
			></textarea>
			<button className="btn-dark mt-5 px-10" type="submit">
				{action}
			</button>
		</form>
	);
};

export default CommentField;
