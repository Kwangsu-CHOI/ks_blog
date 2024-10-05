import { Link } from "react-router-dom";
import { getDay } from "../common/date";
import { useContext, useEffect, useState } from "react";
import NotificationCommentField from "./notification-comment-field.component";
import {
	deleteComment,
	deleteNotification,
	getBlog,
	getUser,
} from "../firebase/firestore-operations";
import { auth } from "../firebase/firebase";
import { useRecoilValue, useSetRecoilState } from "recoil";
import { userAuthState } from "../recoil/atoms";

const NotificationCard = ({ data, index, notificationState }) => {
	let {
		type,
		seen,
		reply,
		replied_on_comment,
		comment,
		createdAt,
		user,
		blog: { _id, blog_id, title },
		_id: notification_id,
		id: firestore_id,
	} = data;
	const [userData, setUserData] = useState(null);
	const [blogExists, setBlogExists] = useState(true);

	const actualBlogId = blog_id || _id;

	const userAuth = useRecoilValue(userAuthState);
	const setUserAuth = useSetRecoilState(userAuthState);

	useEffect(() => {
		const fetchUserData = async () => {
			try {
				const fetchedUserData = await getUser(user.id);
				if (fetchedUserData) {
					setUserData(fetchedUserData);
				}
			} catch (error) {
				console.error("Error fetching user data:", error);
			}
		};

		const checkBlogExists = async () => {
			try {
				const blog = await getBlog(actualBlogId);
				setBlogExists(!!blog);
			} catch (error) {
				console.error("Error checking blog existence:", error);
				setBlogExists(false);
			}
		};

		fetchUserData();
		checkBlogExists();
	}, [user.id, actualBlogId]);

	const { personal_info } = userData || {};
	const { username, fullname, profile_img } = personal_info || {};

	let {
		notifications,
		notifications: { results, totalDocs },
		setNotifications,
	} = notificationState;

	const [isReplying, setIsReplying] = useState(false);

	const handleReplyClick = () => {
		setIsReplying((preVal) => !preVal);
	};

	const handleDelete = async (comment_id, type) => {
		try {
			await deleteComment(comment_id);

			if (type == "comment") {
				results.splice(index, 1);
			} else {
				delete results[index].reply;
			}

			setNotifications({
				...notifications,
				results,
				totalDocs: totalDocs - 1,
				deletedDocCount: notifications.deletedDocCount + 1,
			});
		} catch (err) {
			console.error("Error deleting comment: ", err);
		}
	};

	const handleDeleteNotification = async () => {
		if (!firestore_id) {
			console.error("Invalid Firestore document ID");
			return;
		}
		try {
			await deleteNotification(firestore_id);
			results.splice(index, 1);
			setNotifications({
				...notifications,
				results,
				totalDocs: totalDocs - 1,
				deletedDocCount: notifications.deletedDocCount + 1,
			});
		} catch (err) {
			console.error("Error deleting notification: ", err);
		}
	};

	return (
		<div
			className={`p-6 border-b border-grey border-l-black ${
				!seen ? "border-l-2" : ""
			}`}
		>
			<div className="flex gap-5 mb-3">
				<img
					src={profile_img}
					alt=""
					className="w-14 h-14 flex-none rounded-full"
				/>
				<div className="w-full">
					<h1 className="font-medium text-xl text-dark-grey">
						<span className="lg:inline-block hidden capitalize">
							{fullname}
						</span>
						<Link
							to={`/user/${username}`}
							className="mx-1 text-black underline"
						>
							@{username}
						</Link>
						<span className="ml-2 font-normal">
							{type == "like"
								? "liked your post"
								: type == "comment"
								? "commented on"
								: "replied on"}
						</span>
					</h1>
					{blog_id && title && (
						<Link
							to={`/blog/${blog_id}`}
							className="font-medium text-dark-grey hover:underline line-clamp-1 mt-2"
						>
							{`Post title: "${title}"`}
						</Link>
					)}
					{type == "reply" && replied_on_comment && (
						<div className="p-4 mt-4 rounded-md bg-grey">
							<p className="font-medium">Original comment:</p>
							<p>{replied_on_comment.comment}</p>
						</div>
					)}
				</div>
			</div>

			{type != "like" && comment && (
				<p className="ml-14 pl-5 font-gelasio text-xl my-5">
					{comment.comment}
				</p>
			)}

			<div className="ml-14 pl-5 mt-3 text-dark-grey flex gap-8">
				{type != "like" && (
					<>
						{!reply && blogExists ? (
							<button
								className="underline hover:text-black"
								onClick={handleReplyClick}
							>
								Reply
							</button>
						) : (
							""
						)}
						{blogExists ? (
							<button
								className="underline hover:text-red"
								onClick={() => handleDelete(comment._id, "comment")}
							>
								Delete
							</button>
						) : (
							<span className="text-red-500">Blog post deleted</span>
						)}
						<p>{getDay(createdAt)}</p>
						<button
							onClick={handleDeleteNotification}
							className="text-red-500 hover:text-red-700 transition-colors"
							aria-label="Delete notification"
						>
							<i className="fi fi-rr-trash text-xl hover:text-red"></i>
						</button>
					</>
				)}
				{type === "like" && (
					<button
						onClick={handleDeleteNotification}
						className="text-red-500 hover:text-red-700 transition-colors"
						aria-label="Delete notification"
					>
						<i className="fi fi-rr-trash text-xl hover:text-red"></i>
					</button>
				)}
			</div>

			{isReplying && (
				<div className="mt-8">
					<NotificationCommentField
						blog_id={actualBlogId}
						blog_author={user}
						index={index}
						replyingTo={comment._id}
						setIsReplying={setIsReplying}
						notification_id={notification_id}
						notificationData={notificationState}
					/>
				</div>
			)}

			{reply && (
				<div className="ml-20 p-5 bg-grey mt-5 rounded-md">
					<div className="flex gap-3 mb-3">
						<img src={profile_img} alt="" className="w-8 h-8 rounded-full" />
						<div>
							<h1 className="font-medium text-xl text-dark-grey">
								<Link
									to={`/user/${
										auth.currentUser.displayName ||
										userAuth.personal_info.username
									}`}
									className="mx-1 text-black underline"
								>
									@
									{auth.currentUser.displayName ||
										userAuth.personal_info.username}
								</Link>
								<span className="font-normal">replied to</span>
								<Link
									to={`/user/${username}`}
									className="mx-1 text-black underline"
								>
									@{username}
								</Link>
							</h1>
						</div>
					</div>
					{reply.comment && (
						<p className="ml-14 font-gelasio text-xl my-2">{reply.comment}</p>
					)}
					{blogExists ? (
						<button
							className="underline hover:text-red ml-14 mt-2"
							onClick={() => handleDelete(reply._id, "reply")}
						>
							Delete
						</button>
					) : (
						<span className="text-red-500 ml-14 mt-2">Blog post deleted</span>
					)}
				</div>
			)}
		</div>
	);
};

export default NotificationCard;
