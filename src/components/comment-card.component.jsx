import React, { useContext, useState, useEffect } from "react";
import { getDay } from "../common/date";
import { BlogContext } from "../pages/blog.page";
import CommentField from "./comment-field.component";
import { auth } from "../firebase/firebase";
import { toast } from "react-hot-toast";

const CommentCard = ({
	commentData,
	index,
	leftVal,
	handleReply,
	onDelete,
	setCommentUpdateTrigger,
}) => {
	const { blog, setBlog, userAuth } = useContext(BlogContext);

	const [isReplying, setIsReplying] = useState(false);
	const [showReplies, setShowReplies] = useState(false);
	// const [replies, setReplies] = useState(commentData.replies || []);
	// const [replyCount, setReplyCount] = useState(commentData.replyCount || 0);

	const { id, comment, commentedAt, commentedBy, replies } = commentData;

	const replyCount = replies ? replies.length : 0;
	// const replyCount = commentData.replies ? commentData.replies.length : 0;

	// useEffect(() => {
	// 	setReplies(commentData.replies || []);
	// }, [commentData]);

	const handleReplyClick = () => {
		if (!auth.currentUser) {
			return toast.error("댓글을 작성하려면 로그인이 필요합니다.");
		}
		setIsReplying(!isReplying);
	};

	const handleReplySubmit = async (replyContent) => {
		try {
			await handleReply(replyContent, id);
			setIsReplying(false);
			setCommentUpdateTrigger((prev) => prev + 1);
			// toast.success("Comment added successfully 😁");
		} catch (error) {
			console.error("Error adding comment: ", error);
			toast.error("Failed to add comment 😢");
		}
	};

	const handleDeleteComment = async () => {
		try {
			const result = await onDelete(
				id,
				commentData.isReply,
				commentData.parent
			);
			if (result) {
				setCommentUpdateTrigger((prev) => prev + 1);
			}
		} catch (error) {
			console.error("Error deleting comment: ", error);
			toast.error("Failed to delete comment 😢");
		}
	};

	return (
		<div className="w-full" style={{ paddingLeft: `${leftVal * 10}px` }}>
			<div className="my-5 p-6 rounded-md border border-grey">
				<div className="flex gap-3 items-center mb-8">
					<img
						className="w-6 h-6 rounded-full"
						src={commentedBy.profile_img}
						alt=""
					/>
					<p className="line-clamp-1">
						{commentedBy.fullname} @{commentedBy.username}
					</p>
					<p className="min-w-fit">{getDay(commentedAt)}</p>
				</div>

				<p className="text-xl font-gelasio ml-3">{comment}</p>

				<div className="flex gap-5 items-center mt-5">
					<button
						className="text-dark-grey p-2 px-3 hover:bg-grey/30 rounded-md flex items-center gap-2"
						onClick={() => setShowReplies(!showReplies)}
					>
						{showReplies ? <i className="fi fi-rs-comment-dots"></i> : ""}
						{showReplies
							? "Hide"
							: `${replyCount} ${replyCount <= 1 ? "Reply" : "Replies"}`}
					</button>

					<button className="underline" onClick={handleReplyClick}>
						Reply
					</button>

					{(userAuth?.personal_info?.username === commentedBy.username ||
						userAuth?.personal_info?.username ===
							blog?.author?.personal_info?.username) && (
						<button
							className="p-2 px-3 rounded-md border border-grey ml-auto hover:bg-red/30 hover:text-red flex items-center"
							onClick={handleDeleteComment}
						>
							<i className="fi fi-rr-trash pointer-events-none"></i>
						</button>
					)}
				</div>

				{isReplying && (
					<div className="mt-8">
						<CommentField
							action="reply"
							replyingTo={id}
							setReplying={setIsReplying}
							onSubmit={handleReplySubmit}
						/>
					</div>
				)}
			</div>

			{showReplies && replies && replies.length > 0 && (
				<div>
					{replies.map((reply) => (
						<CommentCard
							key={reply.id}
							commentData={reply}
							leftVal={leftVal + 1}
							handleReply={handleReply}
							onDelete={onDelete}
							setCommentUpdateTrigger={setCommentUpdateTrigger}
						/>
					))}
				</div>
			)}
		</div>
	);
};

export default CommentCard;
