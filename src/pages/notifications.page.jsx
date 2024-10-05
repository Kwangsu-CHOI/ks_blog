import React, { useContext, useEffect, useState } from "react";
import Loader from "../components/loader.component";
import AnimationWrapper from "../common/page-animation";
import NoDataMessage from "../components/nodata.component";
import NotificationCard from "../components/notification-card.component";
import LoadMoreDataBtn from "../components/load-more.component";
import {
	getNotifications,
	markNotificationsAsSeen,
} from "../firebase/firestore-operations";
import {
	onSnapshot,
	query,
	collection,
	where,
	orderBy,
	doc,
	updateDoc,
} from "firebase/firestore";
import { db } from "../firebase/firebase";
import { useRecoilState, useRecoilValue } from "recoil";
import { userAuthState, isAuthLoadingState } from "../recoil/atoms";

const Notifications = () => {
	const [userAuth, setUserAuth] = useRecoilState(userAuthState);
	const isAuthLoading = useRecoilValue(isAuthLoadingState);
	const [filter, setFilter] = useState("all");
	const [notifications, setNotifications] = useState(null);
	const [loading, setLoading] = useState(true);

	let filters = ["all", "like", "comment", "reply"];

	const fetchNotifications = async ({ page = 1 }) => {
		if (!userAuth.id) return;

		try {
			const fetchedNotifications = await getNotifications(
				userAuth.id,
				filter,
				page
			);
			setNotifications((prevNotifications) => ({
				results:
					page === 1
						? fetchedNotifications
						: [...(prevNotifications?.results || []), ...fetchedNotifications],
				page,
				hasMore: fetchedNotifications.length === 5,
			}));
			setLoading(false);
		} catch (error) {
			console.error("error fetching notifications: ", error);
			setLoading(false);
		}
	};

	useEffect(() => {
		if (!isAuthLoading && userAuth.id) {
			console.log("Fetching notifications with filter:", filter);
			setLoading(true);
			setNotifications(null);
			fetchNotifications({ page: 1 });

			// 실시간 알림 리스너
			const notificationsRef = collection(db, "notifications");
			let q = query(
				notificationsRef,
				where("notification_for", "==", userAuth.id),
				orderBy("createdAt", "desc")
			);

			if (filter !== "all") {
				q = query(q, where("type", "==", filter));
			}

			const unsubscribe = onSnapshot(q, (snapshot) => {
				snapshot.docChanges().forEach((change) => {
					if (change.type === "added") {
						setNotifications((prev) => ({
							...prev,
							results: [change.doc.data(), ...(prev?.results || [])],
						}));
					}
				});
			});

			return () => unsubscribe();
		}
	}, [userAuth.id, filter, isAuthLoading]);

	useEffect(() => {
		if (userAuth.id && notifications?.results?.length > 0) {
			const markAsSeen = async () => {
				try {
					await markNotificationsAsSeen(userAuth.id);
					const updatedUserAuth = {
						...userAuth,
						new_notification_available: false,
					};
					setUserAuth(updatedUserAuth);

					// Firestore에서 사용자 문서 업데이트
					const userRef = doc(collection(db, "users"), userAuth.id);
					await updateDoc(userRef, { new_notification_available: false });
					// localStorage 업데이트
					// 그 다음 로컬 상태 업데이트
					setUserAuth(updatedUserAuth);
				} catch (error) {
					console.error("Error marking notifications as seen:", error);
				}
			};

			markAsSeen();
		}
	}, [userAuth.id, notifications]);

	const handleFilter = (newFilter) => {
		setFilter(newFilter);
	};

	const handleDeleteNotification = async (notificationId) => {
		try {
			await deleteNotification(notificationId);
			setNotifications((prevNotifications) => ({
				...prevNotifications,
				results: prevNotifications.results.filter(
					(notification) => notification.id !== notificationId
				),
			}));
		} catch (error) {
			console.error("알림 삭제 오류:", error);
		}
	};

	if (isAuthLoading) {
		return <Loader />;
	}

	return (
		<div>
			<h1 className="max-md:hidden">Recent Notifications</h1>
			<div className="my-8 flex gap-6">
				{filters.map((filterName, i) => (
					<button
						key={i}
						className={`py-2 ${
							filter == filterName ? "btn-dark" : "btn-light"
						}`}
						onClick={() => handleFilter(filterName)}
					>
						{filterName}
					</button>
				))}
			</div>
			{loading ? (
				<Loader />
			) : notifications?.results?.length ? (
				<>
					{notifications.results.map((notification, i) => (
						<AnimationWrapper
							key={notification.id || `notification-${i}`}
							transition={{ delay: i * 0.08 }}
						>
							<NotificationCard
								key={notification.id || `notification-${i}`}
								data={notification}
								index={i}
								notificationState={{ notifications, setNotifications }}
								onDelete={handleDeleteNotification}
							/>
						</AnimationWrapper>
					))}
					{notifications &&
						notifications.results.length > 0 &&
						notifications.hasMore && (
							<LoadMoreDataBtn
								state={notifications}
								fetchDataFun={fetchNotifications}
								additionalParam={{}}
							/>
						)}
				</>
			) : (
				<NoDataMessage message="No notifications available" />
			)}
		</div>
	);
};

export default Notifications;
