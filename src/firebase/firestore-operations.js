import { db, auth, storage } from "./firebase";
import {
	doc,
	setDoc,
	getDoc,
	updateDoc,
	deleteDoc,
	collection,
	query,
	where,
	getDocs,
	orderBy,
	limit,
	serverTimestamp,
	increment,
	startAfter,
	addDoc,
	writeBatch,
	arrayUnion,
	arrayRemove,
} from "firebase/firestore";
import {
	ref,
	uploadBytes,
	getDownloadURL,
	deleteObject,
	getStorage,
} from "firebase/storage";
import {
	createUserWithEmailAndPassword,
	signInWithEmailAndPassword,
	signInWithPopup,
	GoogleAuthProvider,
} from "firebase/auth";
import { onSnapshot } from "firebase/firestore";
import { generateProfileImageUrl } from "./schema";

// User operations
export const createUser = async (userData) => {
	const { email, password, ...otherData } = userData;
	try {
		const userCredential = await createUserWithEmailAndPassword(
			auth,
			email,
			password
		);
		const user = userCredential.user;
		const newUser = {
			personal_info: {
				fullname: otherData.fullname,
				email: user.email,
				username: otherData.username || email.split("@")[0],
				bio: "",
				profile_img: generateProfileImageUrl(),
			},
			account_info: {
				total_posts: 0,
				total_reads: 0,
			},
			isAdmin: false,
			new_notification_available: false,
			social_links: {
				youtube: "",
				instagram: "",
				facebook: "",
				twitter: "",
				github: "",
				website: "",
			},
			joinedAt: serverTimestamp(),
		};
		await setDoc(doc(db, "users", user.uid), newUser);

		return { id: user.uid, ...newUser };
	} catch (error) {
		console.error("Error in createUser:", error);
		throw new Error(`Failed to create user: ${error.message}`);
	}
};

export const signInUser = async (email, password) => {
	try {
		const userCredential = await signInWithEmailAndPassword(
			auth,
			email,
			password
		);
		const user = userCredential.user;
		const userDoc = await getDoc(doc(db, "users", user.uid));
		if (userDoc.exists()) {
			return { id: user.uid, ...userDoc.data() };
		} else {
			throw new Error("User data not found");
		}
	} catch (error) {
		throw error;
	}
};

export const signInWithGoogle = async () => {
	const provider = new GoogleAuthProvider();
	provider.setCustomParameters({
		prompt: "select_account",
	});
	try {
		const result = await signInWithPopup(auth, provider);
		const user = result.user;
		const userDoc = await getDoc(doc(db, "users", user.uid));
		if (!userDoc.exists()) {
			const newUser = {
				personal_info: {
					fullname: user.displayName,
					email: user.email,
					username: user.email.split("@")[0],
					bio: "",
					profile_img: user.photoURL,
				},
				account_info: {
					total_posts: 0,
					total_reads: 0,
				},
				social_links: {},
				joinedAt: serverTimestamp(),
			};
			await setDoc(doc(db, "users", user.uid), newUser);
			return { id: user.uid, ...newUser };
		} else {
			return { id: user.uid, ...userDoc.data() };
		}
	} catch (error) {
		console.error("Google Sign In Error:", error);
		throw error;
	}
};

export const getUser = async (id) => {
	const userDoc = await getDoc(doc(db, "users", id));
	return userDoc.exists() ? { id: userDoc.id, ...userDoc.data() } : null;
};

export const updateUser = async (userId, userData) => {
	const userRef = doc(db, "users", userId);

	console.log("Updating user in Firestore:", userId, userData);

	try {
		await updateDoc(userRef, {
			"personal_info.fullname": userData.personal_info.fullname,
			"personal_info.bio": userData.personal_info.bio,
			"personal_info.profile_img": userData.personal_info.profile_img,
			"personal_info.username": userData.personal_info.username,
			"personal_info.email": userData.personal_info.email,
			social_links: userData.social_links,
		});
		console.log("User update successful");

		// 업데이트 후 사용자 데이터를 다시 가져와 확인
		const updatedUser = await getDoc(userRef);
		console.log("Updated user data from Firestore:", updatedUser.data());
		return updatedUser.data();
	} catch (error) {
		console.error("Error updating user: ", error);
		throw error;
	}
};

export const getUserBlogs = async (userId, page = 1, limitCount = 5) => {
	if (!userId) {
		console.log("UserId is undefined");
		return [];
	}
	try {
		const blogsRef = collection(db, "blogs");
		const q = query(
			blogsRef,
			where("author.id", "==", userId),
			orderBy("publishedAt", "desc"),
			limit(page * limitCount)
		);

		const querySnapshot = await getDocs(q);
		const blogs = querySnapshot.docs.map((doc) => ({
			id: doc.id,
			...doc.data(),
		}));

		console.log("Fetched blogs:", blogs); // 디버깅을 위한 로그

		return blogs;
	} catch (error) {
		console.error("Error fetching user blogs:", error);
		return [];
	}
};

export const searchUsers = async (searchQuery) => {
	const usersRef = collection(db, "users");
	const q = query(
		usersRef,
		where("personal_info.username", ">=", searchQuery),
		where("personal_info.username", "<=", searchQuery + "\uf8ff"),
		limit(10)
	);
	const querySnapshot = await getDocs(q);
	return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
};

// Blog operations
export const addBlog = async (blogData) => {
	const blogId = Date.now().toString();
	const currentUser = auth.currentUser;
	if (!currentUser) {
		throw new Error("User not authenticated");
	}
	const newBlog = {
		...blogData,
		blog_id: blogId,
		publishedAt: serverTimestamp(),
		activity: {
			total_likes: 0,
			total_comments: 0,
			total_reads: 0,
			total_parent_comments: 0,
		},
		author: {
			...blogData.author,
			id: currentUser.uid,
		},
	};
	await setDoc(doc(db, "blogs", blogId), newBlog);
	const userRef = doc(db, "users", blogData.author.id);
	await updateDoc(userRef, {
		"account_info.total_posts": increment(1),
	});

	return { id: blogId, ...newBlog };
};

export const getBlog = async (blogId) => {
	const blogDoc = await getDoc(doc(db, "blogs", blogId));
	return blogDoc.exists() ? { id: blogDoc.id, ...blogDoc.data() } : null;
};

export const updateBlog = async (blogId, updateData) => {
	await updateDoc(doc(db, "blogs", blogId), updateData);
};

export const deleteBlog = async (blogId) => {
	await deleteDoc(doc(db, "blogs", blogId));
};

export const getLatestBlogs = async (page = 1, limit = 5) => {
	const blogsRef = collection(db, "blogs");
	const q = query(
		blogsRef,
		where("draft", "==", false),
		orderBy("publishedAt", "desc"),
		limit(limit * page)
	);
	const querySnapshot = await getDocs(q);
	return querySnapshot.docs.map((doc) => {
		const data = doc.data();
		return {
			id: doc.id,
			...data,
			publishedAt: data.publishedAt ? data.publishedAt.toDate() : null,
		};
	});
};

export const getTrendingBlogs = async (limit = 5) => {
	const blogsRef = collection(db, "blogs");
	const q = query(
		blogsRef,
		where("draft", "==", false),
		orderBy("activity.total_reads", "desc"),
		limit(limit)
	);
	const querySnapshot = await getDocs(q);
	return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
};

export const searchBlogs = async (searchQuery, page = 1, limitCount = 5) => {
	console.log("Entering searchBlogs function");
	const blogsRef = collection(db, "blogs");
	console.log("Created blogsRef");
	const q = query(
		blogsRef,
		where("draft", "==", false),
		where("title", ">=", searchQuery),
		where("title", "<=", searchQuery + "\uf8ff"),
		orderBy("title"),
		limit(limitCount * page)
	);
	console.log("Created query");
	const querySnapshot = await getDocs(q);
	console.log("Got query snapshot");
	return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
};

// Image upload
export const uploadImage = async (file, path) => {
	const storage = getStorage();
	const storageRef = ref(storage, path);

	try {
		const snapshot = await uploadBytes(storageRef, file);
		const downloadURL = await getDownloadURL(snapshot.ref);
		return downloadURL;
	} catch (error) {
		console.error("Error uploading image: ", error);
		throw error;
	}
};

export const deleteImage = async (path) => {
	const storageRef = ref(storage, path);
	await deleteObject(storageRef);
};

// Comments operations

const commentCache = new Map();
const invalidateCommentsCache = (blogId) => {
	for (let key of commentCache.keys()) {
		if (key.startsWith(`${blogId}-`)) {
			commentCache.delete(key);
		}
	}
};

export const deleteComment = async (commentId, blogId) => {
	try {
		const commentRef = doc(db, "comments", commentId);
		const commentSnap = await getDoc(commentRef);

		if (commentSnap.exists()) {
			const commentData = commentSnap.data();

			// Delete the comment
			await deleteDoc(commentRef);

			// Update the blog's comment count
			const blogRef = doc(db, "blogs", blogId);
			await updateDoc(blogRef, {
				"activity.total_comments": increment(-1),
				"activity.total_parent_comments": commentData.isReply
					? increment(0)
					: increment(-1),
			});

			// Delete all replies recursively
			const deleteReplies = async (parentId) => {
				const repliesQuery = query(
					collection(db, "comments"),
					where("parent", "==", parentId)
				);
				const repliesSnapshot = await getDocs(repliesQuery);
				const batch = writeBatch(db);
				let deletedCount = 0;

				for (const replyDoc of repliesSnapshot.docs) {
					batch.delete(replyDoc.ref);
					deletedCount++;
					// Recursively delete nested replies
					const nestedDeletedCount = await deleteReplies(replyDoc.id);
					deletedCount += nestedDeletedCount;
				}

				await batch.commit();
				return deletedCount;
			};

			const deletedRepliesCount = await deleteReplies(commentId);

			// Update the blog's comment count for all deleted replies
			await updateDoc(blogRef, {
				"activity.total_comments": increment(-deletedRepliesCount),
			});

			invalidateCommentsCache(blogId);

			return {
				deletedComment: commentId,
				isReply: commentData.isReply,
				deletedRepliesCount,
			};
		} else {
			console.error("Comment does not exist");
			return null;
		}
	} catch (error) {
		console.error("Error deleting comment:", error);
		throw error;
	}
};

export const getComments = async (
	blogId,
	page = 1,
	limitCount = 5,
	parent = null
) => {
	// const cacheKey = `comments_${blogId}_${page}_${limitCount}_${parent}`;

	// // 캐시된 댓글이 있는지 확인
	// const cachedComments = commentCache.get(cacheKey);
	// if (cachedComments) {
	// 	console.log("캐시에서 댓글 반환");
	// 	return cachedComments;
	// }

	const commentsRef = collection(db, "comments");
	let q = query(
		commentsRef,
		where("blog_id", "==", blogId),
		orderBy("commentedAt", "asc"),
		limit(limitCount)
	);

	try {
		const querySnapshot = await getDocs(q);

		const comments = querySnapshot.docs.map((doc) => ({
			id: doc.id,
			...doc.data(),
			commentedAt: doc.data().commentedAt.toDate(),
		}));

		// 대댓글 가져오기
		const parentCommentIds = comments.map((comment) => comment.id);
		const repliesQuery = query(
			commentsRef,
			where("blog_id", "==", blogId),
			where("parent", "in", parentCommentIds)
		);
		const repliesSnapshot = await getDocs(repliesQuery);
		const replies = repliesSnapshot.docs.map((doc) => ({
			id: doc.id,
			...doc.data(),
			commentedAt: doc.data().commentedAt.toDate(),
		}));

		// 댓글과 대댓글 합치기
		const commentsWithReplies = comments.map((comment) => ({
			...comment,
			replies: replies.filter((reply) => reply.parent === comment.id),
		}));

		// commentCache.set(cacheKey, commentsWithReplies);
		return commentsWithReplies;
	} catch (error) {
		return [];
	}
};

export const addComment = async (commentData) => {
	try {
		const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid));
		const userData = userDoc.data();

		if (!userData) {
			throw new Error("User data not found");
		}

		const newComment = {
			...commentData,
			commentedAt: serverTimestamp(),
			commentedBy: {
				id: auth.currentUser.uid || commentData.author?.id,
				username:
					userData.personal_info.username ||
					auth.currentUser.email.split("@")[0] ||
					commentData.author?.username,
				fullname:
					userData.personal_info.fullname || commentData.author?.fullname,
				profile_img:
					auth.currentUser.photoURL ||
					userData.personal_info.profile_img ||
					commentData.author?.profile_img,
			},
		};
		const commentsRef = collection(db, "comments");
		const docRef = await addDoc(commentsRef, newComment);

		const blogRef = doc(db, "blogs", commentData.blog_id);
		await updateDoc(blogRef, {
			"activity.total_comments": increment(1),
			"activity.total_parent_comments": commentData.isReply
				? increment(0)
				: increment(1),
		});

		//create notification
		const blogDoc = await getDoc(blogRef);
		const blogData = blogDoc.data();

		if (blogData.author.id !== auth.currentUser.uid) {
			let parentCommentData = null;
			if (commentData.isReply) {
				// 부모 댓글 정보 가져오기
				const parentCommentRef = doc(db, "comments", commentData.parent);
				const parentCommentDoc = await getDoc(parentCommentRef);
				if (parentCommentDoc.exists()) {
					parentCommentData = parentCommentDoc.data();
				}
			}

			await createNotification({
				type: commentData.isReply ? "reply" : "comment",
				blog: {
					id: commentData.blog_id,
					title: blogData.title,
					blog_id: commentData.blog_id,
				},
				notification_for: blogData.author.id,
				user: {
					id: auth.currentUser.uid,
					personal_info: {
						fullname: auth.currentUser.displayName || "Anonymous",
						username:
							auth.currentUser.displayName ||
							auth.currentUser.email.split("@")[0],
						profile_img:
							auth.currentUser.photoURL || "/default-profile-image.png",
					},
				},
				comment: {
					_id: docRef.id,
					comment: commentData.comment,
				},
				replied_on_comment: commentData.isReply
					? {
							_id: commentData.parent,
							comment: parentCommentData.comment, // 부모 댓글의 내용
					  }
					: null,
			});
		}

		// 여기서 comment와 parent 필드를 명시적으로 설정합니다.
		invalidateCommentsCache(commentData.blog_id);
		const newCommentWithId = {
			id: docRef.id,
			...newComment,
			comment: commentData.comment,
			parent: commentData.parent,
			commentedAt: new Date(),
			commentedBy: {
				...newComment.commentedBy,
				profile_img:
					newComment.commentedBy.profile_img || "/default-profile-image.png",
			},
		};

		// 새 댓글을 캐시에 추가

		const cacheKey = `${commentData.blog_id}-1-5-${commentData.parent || null}`;
		const cachedComments = commentCache.get(cacheKey) || [];
		commentCache.set(cacheKey, [newCommentWithId, ...cachedComments]);

		return newCommentWithId;
	} catch (error) {
		console.error("Error adding comment:", error);
		throw error;
	}
};

// Like operations
export const likeBlog = async (blogId, userId) => {
	try {
		const blogRef = doc(db, "blogs", blogId);
		const userRef = doc(db, "users", userId);

		await updateDoc(blogRef, {
			"activity.total_likes": increment(1),
		});

		await updateDoc(userRef, {
			likedBlogs: arrayUnion(blogId),
		});

		// 알림 생성
		const blogDoc = await getDoc(blogRef);
		const blogData = blogDoc.data();

		if (blogData.author.id !== userId) {
			await createNotification({
				type: "like",
				blog: {
					_id: blogId,
					title: blogData.title,
					blog_id: blogId,
				},
				notification_for: blogData.author.id,
				user: {
					id: userId,
					personal_info: {
						fullname: auth.currentUser.displayName || "Anonymous",
						username:
							auth.currentUser.displayName ||
							auth.currentUser.email.split("@")[0],
						profile_img:
							auth.currentUser.photoURL || "/default-profile-image.png",
					},
				},
			});
		}
	} catch (error) {
		console.error("Error liking blog:", error);
		throw error;
	}
};

export const unlikeBlog = async (blogId, userId) => {
	const blogRef = doc(db, "blogs", blogId);
	const userRef = doc(db, "users", userId);

	await updateDoc(blogRef, {
		"activity.total_likes": increment(-1),
	});

	await updateDoc(userRef, {
		likedBlogs: arrayRemove(blogId),
	});
};

// Read count increment
export const incrementReadCount = async (blogId) => {
	const blogRef = doc(db, "blogs", blogId);
	await updateDoc(blogRef, {
		"activity.total_reads": increment(1),
	});
};

// Notifications
export const getNotifications = async (
	userId,
	filter = "all",
	page = 1,
	limitCount = 10
) => {
	const notificationsRef = collection(db, "notifications");
	let q = query(
		notificationsRef,
		where("notification_for", "==", userId),
		where("user", "!=", userId),
		orderBy("createdAt", "desc"),
		limit(limitCount * page)
	);

	if (filter !== "all") {
		q = query(q, where("type", "==", filter));
	}

	if (page > 1) {
		const lastDoc = await getLastVisibleDoc(userId, filter, page);
		if (lastDoc) {
			q = query(q, startAfter(lastDoc));
		}
	}

	const querySnapshot = await getDocs(q);
	const notifications = querySnapshot.docs.map((doc) => ({
		id: doc.id,
		...doc.data(),
	}));

	// 알림을 읽음 처리
	const batch = writeBatch(db);
	querySnapshot.docs.forEach((doc) => {
		batch.update(doc.ref, { seen: true });
	});
	await batch.commit();

	return notifications;
};

// 마지막으로 보여진 문서를 가져오는 함수
const getLastVisibleDoc = async (userId, filter, page) => {
	const notificationsRef = collection(db, "notifications");
	let q = query(
		notificationsRef,
		where("notification_for", "==", userId),
		orderBy("createdAt", "desc"),
		limit((page - 1) * 5)
	);

	if (filter !== "all") {
		q = query(q, where("type", "==", filter));
	}

	const querySnapshot = await getDocs(q);
	return querySnapshot.docs[querySnapshot.docs.length - 1];
};

// 새 알림 생성
export const createNotification = async (notificationData) => {
	try {
		const notificationsRef = collection(db, "notifications");
		await addDoc(notificationsRef, {
			...notificationData,
			createdAt: serverTimestamp(),
			seen: false,
		});

		const authorRef = doc(db, "users", notificationData.notification_for);
		await updateDoc(authorRef, {
			new_notification_available: true,
		});
		console.log("Notification created successfully");
	} catch (error) {
		console.error("Error creating notification: ", error);
	}
};

// 새 알림 확인
export const checkNewNotifications = async (userId) => {
	const notificationsRef = collection(db, "notifications");
	const q = query(
		notificationsRef,
		where("notification_for", "==", userId),
		where("seen", "==", false),
		where("user", "!=", userId),
		limit(1)
	);

	const querySnapshot = await getDocs(q);
	return !querySnapshot.empty;
};

// 알림 개수 가져오기
export const getNotificationsCount = async (userId, filter = "all") => {
	const notificationsRef = collection(db, "notifications");
	let q = query(
		notificationsRef,
		where("notification_for", "==", userId),
		where("user", "!=", userId)
	);

	if (filter !== "all") {
		q = query(q, where("type", "==", filter));
	}

	const querySnapshot = await getDocs(q);
	return querySnapshot.size;
};

export const markNotificationsAsSeen = async (userId) => {
	const notificationsRef = collection(db, "notifications");
	const q = query(
		notificationsRef,
		where("notification_for", "==", userId),
		where("seen", "==", false)
	);
	const querySnapshot = await getDocs(q);

	const batch = writeBatch(db);
	querySnapshot.docs.forEach((doc) => {
		batch.update(doc.ref, { seen: true });
	});

	await batch.commit();
};

export const deleteNotification = async (notificationId) => {
	try {
		await deleteDoc(doc(db, "notifications", notificationId));
		console.log("Notification deleted successfully");
	} catch (error) {
		console.error("Error deleting notification:", error);
		throw error;
	}
};
