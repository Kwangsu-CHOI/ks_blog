import { serverTimestamp } from "firebase/firestore";

const profile_imgs_name_list = [
	"Garfield",
	"Tinkerbell",
	"Annie",
	"Loki",
	"Cleo",
	"Angel",
	"Bob",
	"Mia",
	"Coco",
	"Gracie",
	"Bear",
	"Bella",
	"Abby",
	"Harley",
	"Cali",
	"Leo",
	"Luna",
	"Jack",
	"Felix",
	"Kiki",
];

const profile_imgs_collections_list = [
	"notionists-neutral",
	"adventurer-neutral",
	"fun-emoji",
];

export const generateProfileImageUrl = () => {
	const collection =
		profile_imgs_collections_list[
			Math.floor(Math.random() * profile_imgs_collections_list.length)
		];
	const name =
		profile_imgs_name_list[
			Math.floor(Math.random() * profile_imgs_name_list.length)
		];
	return `https://api.dicebear.com/6.x/${collection}/svg?seed=${name}`;
};

export const userSchema = {
	personal_info: {
		fullname: "",
		email: "",
		password: "",
		username: "",
		bio: "",
		profile_img: generateProfileImageUrl(),
	},
	social_links: {
		youtube: "",
		instagram: "",
		facebook: "",
		twitter: "",
		github: "",
		website: "",
	},
	account_info: {
		total_posts: 0,
		total_reads: 0,
	},
	google_auth: false,
	blogs: [],
	joinedAt: serverTimestamp(),
};

export const blogSchema = {
	title: "",
	banner: "",
	content: [],
	tags: [],
	des: "",
	author: {
		personal_info: {
			fullname: "",
			username: "",
			profile_img: "",
		},
		id: "",
	},
	activity: {
		total_likes: 0,
		total_comments: 0,
		total_reads: 0,
		total_parent_comments: 0,
	},
	comments: [],
	draft: false,
	publishedAt: serverTimestamp(),
};

export const commentSchema = {
	blog_id: "",
	blog_author: "",
	comment: "",
	children: [],
	commented_by: {
		id: "",
		personal_info: {
			fullname: "",
			username: "",
			profile_img: "",
		},
	},
	isReply: false,
	parent: "",
	commentedAt: serverTimestamp(),
};

export const notificationSchema = {
	type: "",
	blog: {
		_id: "",
		title: "",
		blog_id: "",
	},
	notification_for: "",
	user: {
		id: "",
		personal_info: {
			fullname: "",
			username: "",
			profile_img: "",
		},
	},
	comment: {
		_id: "",
		comment: "",
	},
	reply: {
		_id: "",
		comment: "",
	},
	replied_on_comment: {
		_id: "",
		comment: "",
	},
	seen: false,
	createdAt: serverTimestamp(),
};

export const createNewUser = (userData) => ({
	...userSchema,
	personal_info: {
		...userSchema.personal_info,
		...userData.personal_info,
	},
	google_auth: userData.google_auth || false,
	joinedAt: serverTimestamp(),
});

export const createNewBlog = (blogData, authorData) => ({
	...blogSchema,
	...blogData,
	author: {
		personal_info: {
			fullname: authorData.fullname,
			username: authorData.username,
			profile_img: authorData.profile_img,
		},
		id: authorData.id,
	},
	publishedAt: serverTimestamp(),
});

export const createNewComment = (commentData, userData) => ({
	...commentSchema,
	...commentData,
	commented_by: {
		id: userData.id,
		personal_info: {
			fullname: userData.fullname,
			username: userData.username,
			profile_img: userData.profile_img,
		},
	},
	commentedAt: serverTimestamp(),
});

export const createNewNotification = (notificationData) => ({
	...notificationSchema,
	...notificationData,
	createdAt: serverTimestamp(),
});
