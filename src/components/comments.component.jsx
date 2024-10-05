import { useContext, useEffect, useState, useCallback } from "react";
import { BlogContext } from "../pages/blog.page";
import CommentField from "./comment-field.component";
import NoDataMessage from "./nodata.component";
import AnimationWrapper from "../common/page-animation";
import CommentCard from "./comment-card.component";
import { auth } from "../firebase/firebase";
import { toast } from "react-hot-toast";
import {
	addComment,
	deleteComment,
	getComments,
} from "../firebase/firestore-operations";

export const fetchComments = async ({
	blog_id,
	setParentCommentCountFun,
	page = 1,
}) => {
	const fetchedComments = await getComments(blog_id, page, 10);

	let commentsTree = [];
	let commentMap = new Map();

	// saving all comments in a Map
	fetchedComments.forEach((comment) => {
		commentMap.set(comment.id, { ...comment, replies: [] });
	});

	// making the CommentTree
	fetchedComments.forEach((comment) => {
		if (comment.parent) {
			const parentComment = commentMap.get(comment.parent);
			if (parentComment) {
				parentComment.replies.push(commentMap.get(comment.id));
			}
		} else {
			commentsTree.push(commentMap.get(comment.id));
		}
	});

	setParentCommentCountFun(commentsTree.length);

	return commentsTree;
};

const CommentsContainer = () => {
	const {
		blog,
		blog: { id },
		setBlog,
		commentsWrapper,
		totalParentCommentsLoaded,
		setTotalParentCommentsLoaded,
	} = useContext(BlogContext);

	const [comments, setComments] = useState([]);
	const [page, setPage] = useState(1);
	const [commentUpdateTrigger, setCommentUpdateTrigger] = useState(0);

	const loadComments = useCallback(async () => {
		if (!id) return;
		try {
			const fetchedComments = await fetchComments({
				blog_id: id,
				setParentCommentCountFun: setTotalParentCommentsLoaded,
				page,
			});
			console.log("fetchedComments:", fetchedComments);

			setComments((prevComments) => {
				const updatedComments = [...prevComments];
				fetchedComments.forEach((fetchedComment) => {
					const existingIndex = updatedComments.findIndex(
						(c) => c.id === fetchedComment.id
					);
					if (existingIndex !== -1) {
						updatedComments[existingIndex] = fetchedComment;
					} else {
						updatedComments.push(fetchedComment);
					}
				});

				const fetchedCommentIds = new Set(fetchedComments.map((c) => c.id));
				const filteredComments = updatedComments.filter((c) =>
					fetchedCommentIds.has(c.id)
				);

				return filteredComments;
			});
		} catch (error) {
			console.error("Error loading comments:", error);
			toast.error("Failed to load comments 😥");
		}
	}, [id, page, setTotalParentCommentsLoaded]);

	const handleAddComment = useCallback(
		async (commentText, parent = null) => {
			if (!auth.currentUser) {
				return toast.error("Please login to add a comment.");
			}

			try {
				const commentObj = {
					blog_id: id,
					comment: commentText,
					parent: parent,
					isReply: !!parent,
					commentedBy: auth.currentUser.uid,
				};

				const newComment = await addComment(commentObj);

				await Promise.all([
					new Promise((resolve) => {
						setComments((prevComments) => {
							let updatedComments;
							if (parent) {
								updatedComments = prevComments.map((comment) =>
									comment.id === parent
										? {
												...comment,
												replies: [...(comment.replies || []), newComment],
										  }
										: comment
								);
							} else {
								updatedComments = [...prevComments, newComment];
							}

							resolve();
							return updatedComments;
						});
					}),
					new Promise((resolve) => {
						setBlog((prevBlog) => {
							const updatedBlog = {
								...prevBlog,
								activity: {
									...prevBlog.activity,
									total_comments: prevBlog.activity.total_comments + 1,
									total_parent_comments: parent
										? prevBlog.activity.total_parent_comments
										: prevBlog.activity.total_parent_comments + 1,
								},
							};

							resolve();
							return updatedBlog;
						});
					}),
				]);

				setCommentUpdateTrigger((prev) => {
					const newValue = prev + 1;

					return newValue;
				});

				await loadComments();

				toast.success("Comment added successfully 😁");
			} catch (error) {
				console.error("Error adding comment:", error);
				toast.error("Failed to add comment 😢");
			}
		},
		[id, setBlog, setCommentUpdateTrigger]
	);

	const handleDeleteComment = useCallback(
		async (commentId, isReply = false, parentId = null) => {
			try {
				const result = await deleteComment(commentId, id);
				if (result) {
					setComments((prevComments) => {
						if (isReply && parentId) {
							return prevComments.map((comment) =>
								comment.id === parentId
									? {
											...comment,
											replies: comment.replies.filter(
												(reply) => reply.id !== commentId
											),
									  }
									: comment
							);
						} else {
							return prevComments.filter((comment) => comment.id !== commentId);
						}
					});

					setBlog((prevBlog) => ({
						...prevBlog,
						activity: {
							...prevBlog.activity,
							total_comments: Math.max(
								prevBlog.activity.total_comments -
									(1 + result.deletedRepliesCount),
								0
							),
							total_parent_comments: isReply
								? prevBlog.activity.total_parent_comments
								: Math.max(prevBlog.activity.total_parent_comments - 1, 0),
						},
					}));

					setCommentUpdateTrigger((prev) => prev + 1);
					toast.success("Comment deleted successfully 😁");
					return true;
				}
				return false;
			} catch (error) {
				console.error("Error deleting comment:", error);
				toast.error("Failed to delete comment 😢");
			}
		},
		[id, setBlog, setCommentUpdateTrigger]
	);

	const handleLoadMore = () => {
		setPage((prevPage) => prevPage + 1);
	};

	useEffect(() => {
		if (blog && commentsWrapper && id) {
			loadComments();
		}
	}, [blog, commentsWrapper, id, loadComments, commentUpdateTrigger]);

	return (
		<div
			className={`max-sm:w-full fixed ${
				commentsWrapper ? "top-0 sm:right-0" : "top-[100%] sm:right-[-100%]"
			} duration-700 max-sm:right-0 sm:top-0 w-[30%] min-w-[350px] h-full z-50 bg-white shadow-2xl p-8 px-16 overflow-y-auto overflow-x-hidden`}
		>
			<CommentField
				action="comment"
				replyingTo={null}
				setReplying={null}
				onSubmit={handleAddComment}
				setCommentUpdateTrigger={setCommentUpdateTrigger}
			/>

			{comments.length ? (
				comments.map((comment) => (
					<AnimationWrapper key={comment.id}>
						<CommentCard
							key={comment.id}
							commentData={comment}
							leftVal={0}
							handleReply={handleAddComment}
							onDelete={handleDeleteComment}
							setCommentUpdateTrigger={setCommentUpdateTrigger}
						/>
					</AnimationWrapper>
				))
			) : (
				<NoDataMessage message="No comments available" />
			)}

			{totalParentCommentsLoaded > comments.length ? (
				<button
					className="text-dark-grey p-2 px-3 hover:bg-grey/30 rounded-md flex items-center gap-2"
					onClick={handleLoadMore}
				>
					Load More
				</button>
			) : null}
		</div>
	);
};

export default CommentsContainer;
