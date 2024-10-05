import React, { useCallback, useContext, useState } from "react";
import { Toaster, toast } from "react-hot-toast";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db, auth } from "../firebase/firebase";
import { useRecoilValue } from "recoil";
import { userAuthState } from "../recoil/atoms";

const NotificationCommentField = React.memo(
	({
		blog_id,
		blog_author,
		index = undefined,
		replyingTo = undefined,
		setIsReplying,
		notification_id,
		notificationData,
	}) => {
		const [comment, setComment] = useState("");
		const userAuth = useRecoilValue(userAuthState);

		let {
			notifications,
			notifications: { results },
			setNotifications,
		} = notificationData;

		const handleComment = useCallback(async () => {
			if (!comment.length) {
				return toast.error("Write something to leave a comment.");
			}

			try {
				const commentData = {
					blog_id,
					comment,
					isReply: Boolean(replyingTo),
					parent: replyingTo,
					commentedBy: {
						id: userAuth.id,
						username: userAuth.personal_info.username,
						fullname: userAuth.personal_info.fullname,
						profile_img: userAuth.personal_info.profile_img,
					},
					commentedAt: serverTimestamp(),
				};

				const docRef = await addDoc(collection(db, "comments"), commentData);

				setIsReplying(false);
				let { results } = notificationData.notifications;
				results[index].reply = { comment, _id: docRef.id };
				notificationData.setNotifications({
					...notificationData.notifications,
					results,
				});

				toast.success("Reply added successfully");
				setComment(""); // 댓글 입력 필드 초기화
			} catch (err) {
				console.error("Error adding reply: ", err);
				toast.error("Failed to add reply");
			}
		}, [
			comment,
			blog_id,
			replyingTo,
			userAuth,
			notifications,
			setNotifications,
		]);

		return (
			<>
				<Toaster />
				<textarea
					value={comment}
					onChange={(e) => setComment(e.target.value)}
					placeholder="Reply this comment..."
					className="input-box pl-5 placeholder:text-dark-grey resize-none h-[150px] overflow-auto"
				></textarea>
				<button className="btn-dark mt-5 px-10" onClick={handleComment}>
					Reply
				</button>
			</>
		);
	}
);

export default NotificationCommentField;
