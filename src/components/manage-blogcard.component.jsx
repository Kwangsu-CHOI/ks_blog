import { Link } from "react-router-dom";
import { getDay } from "../common/date";
import { useContext, useState } from "react";
import { doc, deleteDoc, updateDoc, increment } from "firebase/firestore";
import { db } from "../firebase/firebase";
import { useRecoilValue } from "recoil";
import { userAuthState } from "../recoil/atoms";
import { deleteComment, getComments } from "../firebase/firestore-operations";

const BlogStats = ({ stats }) => {
	if (!stats || Object.keys(stats).length === 0) {
		return <div>No stats available</div>;
	}
	return (
		<div className="flex gap-2 max-lg:mb-6 max-lg:pb-6 border-grey max-lg:border-b">
			{Object.keys(stats).map((key, i) => {
				return !key.includes("parent") ? (
					<div
						key={i}
						className={
							"flex flex-col items-center w-full h-full justify-center p-4 px-6 " +
							(i != 0 ? " border-grey border-l " : "")
						}
					>
						<h1 className="text-xl lg:text-2xl mb-2">
							{stats[key].toLocaleString()}
						</h1>
						<p className="max-lg:text-dark-grey capitalize">
							{key.split("_")[1]}
						</p>
					</div>
				) : (
					""
				);
			})}
		</div>
	);
};

export const ManagePublishedBlogCard = ({ blog }) => {
	let { banner, id, title, publishedAt, activity } = blog;

	const [showStat, setShowStat] = useState(false);

	return (
		<>
			<div className="flex gap-10 border-b mb-6 max-md:px-4 border-grey pb-6 items-center">
				<img
					src={banner}
					alt=""
					className="max-md:hidden lg:hidden xl:block w-28 h-28 flex-none bg-grey object-cover"
				/>
				<div className="flex flex-col justify-between py-2 w-full min-w-[300px]">
					<div>
						<Link
							to={`/blog/${id}`}
							className="blog-title mb-4 hover:underline"
						>
							{title}
						</Link>
						<p className="line-clamp-1">Published on {getDay(publishedAt)}</p>
					</div>

					<div className="flex gap-6 mt-3">
						<Link to={`/editor/${id}`} className="pr-4 py-2 underline">
							Edit
						</Link>
						<button
							className="lg:hidden pr-4 py-2 underline"
							onClick={() => setShowStat((preVal) => !preVal)}
						>
							Stats
						</button>
						<button
							className="pr-4 py-2 underline text-red"
							onClick={(e) => deleteBlog(blog, e.target)}
						>
							Delete
						</button>
					</div>
				</div>

				<div className="max-lg:hidden">
					<BlogStats stats={activity} />
				</div>
			</div>

			{showStat ? (
				<div>
					<BlogStats stats={activity} className="lg:hidden" />
				</div>
			) : (
				""
			)}
		</>
	);
};

export const ManageDraftBlogPost = ({ blog }) => {
	let { title, des, blog_id, index } = blog;

	index++;

	return (
		<div className="flex gap-5 lg:gap-10 pb-6 border-b mb-6 border-grey">
			<h1 className="blog-index text-center pl-4 md:pl-6 flex-none">
				{index < 10 ? "0" + index : index}
			</h1>

			<div>
				<h1 className="blog-title mb-3">{title}</h1>
				<p className="line-clamp-2 font-gelasio">
					{des.length ? des : "No description"}
				</p>

				<div className="flex gap-6 mt-3">
					<Link to={`/editor/${blog_id}`} className="pr-4 py-2 underline">
						Edit
					</Link>
					<button
						className="pr-4 py-2 underline text-red"
						onClick={(e) => deleteBlog(blog, e.target)}
					>
						Delete
					</button>
				</div>
			</div>
		</div>
	);
};

const deleteBlog = async (blog, target) => {
	let { id, setStateFunc, index } = blog;

	target.setAttribute("disabled", true);

	try {
		console.log("Attempting to delete blog with ID:", id);

		if (!id) {
			throw new Error("Blog ID is undefined or null");
		}

		// 블로그의 모든 댓글 가져오기
		const comments = await getComments(id);

		// 모든 댓글 삭제
		for (const comment of comments) {
			await deleteComment(comment.id, id);
		}

		await deleteDoc(doc(db, "blogs", id));

		target.removeAttribute("disabled");

		setStateFunc((preVal) => {
			let { deletedDocCount, totalDocs, results } = preVal;

			results.splice(index, 1);

			if (!deletedDocCount) {
				deletedDocCount = 0;
			}

			if (!results.length && totalDocs - 1 > 0) {
				return null;
			}

			return {
				...preVal,
				totalDocs: totalDocs - 1,
				deletedDocCount: deletedDocCount + 1,
			};
		});
	} catch (error) {
		console.error("Error deleting blog: ", error);
		target.removeAttribute("disabled");
	}
};

const ManageBlogCard = ({ blog }) => {
	if (blog.draft) {
		return <ManageDraftBlogPost blog={blog} />;
	} else {
		return <ManagePublishedBlogCard blog={blog} />;
	}
};

export default ManageBlogCard;
