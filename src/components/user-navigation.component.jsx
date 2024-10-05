import { useContext, useEffect } from "react";
import AnimationWrapper from "../common/page-animation";
import { Link, useNavigate } from "react-router-dom";
import { userAuthState } from "../recoil/atoms";
import { useRecoilValue, useSetRecoilState } from "recoil";

const UserNavigationPanel = ({ handleSignOut }) => {
	const userAuth = useRecoilValue(userAuthState);
	const setUserAuth = useSetRecoilState(userAuthState);

	const { username, isAdmin, id } = userAuth || {};

	console.log(userAuth);

	return (
		<AnimationWrapper
			transition={{ duration: 0.2 }}
			className="absolute right-0 z-50"
		>
			<div className="bg-white opacity-90">
				{isAdmin ? (
					<Link to="/editor" className="flex gap-2 link md:hidden pl-8 py-4">
						<i className="fi fi-rr-file-edit"></i>
						<p>Write</p>
					</Link>
				) : (
					""
				)}

				<Link to={`/user/${id}`} className="link pl-8 py-4">
					Profile
				</Link>
				<Link to="/dashboard" className="link pl-8 py-4">
					Dashboard
				</Link>
				<Link to="/settings/edit-profile" className="link pl-8 py-4">
					Settings
				</Link>

				<span className="absolute border-t border-grey w-[100%]"></span>
				<button
					className="text-left p-4 hover:bg-grey w-full pl-8 py-4"
					onClick={handleSignOut}
				>
					<h1
						className="font-bold text-xl mg1
        "
					>
						Sign Out
					</h1>
					<p className="text-dark-grey">@{userAuth.personal_info.username}</p>
				</button>
			</div>
		</AnimationWrapper>
	);
};
export default UserNavigationPanel;
