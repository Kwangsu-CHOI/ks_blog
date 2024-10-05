import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import InpageNavigation from "../components/inpage-navigation.component";
import Loader from "../components/loader.component";
import AnimationWrapper from "../common/page-animation";
import BlogPostCard from "../components/blog-post.component";
import NoDataMessage from "../components/nodata.component";
import LoadMoreDataBtn from "../components/load-more.component";
import UserCard from "../components/usercard.component";
import { searchBlogs, searchUsers } from "../firebase/firestore-operations";

const SearchPage = () => {
	const { query: searchQuery } = useParams();
	const [blogs, setBlogs] = useState(null);
	const [users, setUsers] = useState(null);

	const fetchBlogs = async ({ page = 1, create_new_arr = false }) => {
		try {
			const fetchedBlogs = await searchBlogs(searchQuery, page, 5);
			setBlogs((prevBlogs) =>
				create_new_arr
					? { results: fetchedBlogs, page }
					: {
							...prevBlogs,
							results: [...(prevBlogs?.results || []), ...fetchedBlogs],
							page,
					  }
			);
		} catch (error) {
			console.error("Error searching blogs: ", error);
		}
	};

	const fetchUsers = async () => {
		try {
			const fetchedUsers = await searchUsers(searchQuery);
			setUsers(fetchedUsers);
		} catch (error) {
			console.error("Error fetching users: ", error);
		}
	};

	useEffect(() => {
		setBlogs(null);
		setUsers(null);
		fetchBlogs({ page: 1, create_new_arr: true });
		fetchUsers();
	}, [searchQuery]);

	const UserCardWrapper = () => {
		return (
			<>
				{users === null ? (
					<Loader />
				) : users.length ? (
					users.map((user, i) => (
						<AnimationWrapper
							key={i}
							transition={{ duration: 1, delay: i * 0.08 }}
						>
							<UserCard user={user} />
						</AnimationWrapper>
					))
				) : (
					<NoDataMessage message="No user found" />
				)}
			</>
		);
	};

	return (
		<section className="h-cover flex justify-center gap-10">
			<div className="w-full">
				<InpageNavigation
					routes={[`Search Results for "${searchQuery}"`, "Accounts Matched"]}
					defaultHidden={["Accounts Matched"]}
				>
					<>
						{blogs === null ? (
							<Loader />
						) : blogs.results.length ? (
							blogs.results.map((blog, i) => (
								<AnimationWrapper
									key={i}
									transition={{ duration: 1, delay: i * 0.1 }}
								>
									<BlogPostCard
										content={blog}
										author={blog.author.personal_info}
									/>
								</AnimationWrapper>
							))
						) : (
							<NoDataMessage message="No blogs found" />
						)}
						<LoadMoreDataBtn state={blogs} fetchDataFun={fetchBlogs} />
					</>
					<UserCardWrapper />
				</InpageNavigation>
			</div>

			<div className="min-w-[40%] lg:min-w-[350px] max-w-min border-l border-grey pl-8 pt-3 max-md:hidden">
				<h1 className="font-medium text-xl mb-8">
					User <i className="fi fi-rr-user mt-1"></i>
				</h1>
				<UserCardWrapper />
			</div>
		</section>
	);
};

export default SearchPage;
