import { useContext, useEffect, useRef, useState } from "react";
import AnimationWrapper from "../common/page-animation";
import InputBox from "../components/input.component";
import { Toaster, toast } from "react-hot-toast";
import { auth, db } from "../firebase/firebase";
import {
	updatePassword,
	reauthenticateWithCredential,
	EmailAuthProvider,
} from "firebase/auth";
import { doc, updateDoc } from "firebase/firestore";
import { Link } from "react-router-dom";

const ChangePassword = () => {
	let changePasswordForm = useRef();

	const [isPasswordUser, setIsPasswordUser] = useState(false);

	useEffect(() => {
		const checkUserAuthMethod = () => {
			const user = auth.currentUser;
			if (user) {
				// 사용자의 providerData를 확인하여 이메일/비밀번호 로그인인지 확인
				const passwordProvider = user.providerData.find(
					(provider) => provider.providerId === "password"
				);
				setIsPasswordUser(!!passwordProvider);
			}
		};

		checkUserAuthMethod();
	}, []);

	if (!isPasswordUser) {
		return (
			<AnimationWrapper>
				<div className="w-full max-w-[600px] text-center mx-auto p-8 rounded-lg shadow-lg">
					<h1 className="text-2xl font-bold mb-4 text-white">
						비밀번호 변경 불가
					</h1>
					<div className="bg-yellow-600 text-white p-4 rounded-md mb-4">
						<i className="fi fi-rr-info mr-2"></i>
						구글 로그인 사용자는 이 페이지에서 비밀번호를 변경할 수 없습니다.
					</div>
					<p className="text-gray-300 mb-6">
						구글 계정 설정에서 비밀번호를 변경해주세요.
					</p>
					<Link
						to="/dashboard"
						className="btn-dark px-6 py-2 rounded-full hover:bg-gray-700 transition duration-300"
					>
						대시보드로 돌아가기
					</Link>
				</div>
			</AnimationWrapper>
		);
	}

	let passwordRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,20}$/;

	const handleSubmit = async (e) => {
		e.preventDefault();

		let form = new FormData(changePasswordForm.current);
		let { currentPassword, newPassword, confirmNewPassword } =
			Object.fromEntries(form);

		if (!currentPassword || !newPassword || !confirmNewPassword) {
			return toast.error("Please fill in all fields.");
		}

		if (currentPassword === newPassword) {
			return toast.error(
				"New password must be different from current password."
			);
		}

		if (newPassword !== confirmNewPassword) {
			return toast.error("New password does not match.");
		}

		if (
			!passwordRegex.test(currentPassword) ||
			!passwordRegex.test(newPassword)
		) {
			return toast.error(
				"Password should be 6 to 20 characters long with at least 1 numeric, 1 lowercase, and 1 uppercase."
			);
		}

		const user = auth.currentUser;
		const credential = EmailAuthProvider.credential(
			user.email,
			currentPassword
		);

		try {
			await reauthenticateWithCredential(user, credential);
			await updatePassword(user, newPassword);

			// Update password in Firestore if you're storing it there (not recommended for security reasons)
			// await updateDoc(doc(db, "users", user.uid), {
			//   password: newPassword
			// });

			toast.success("Password changed successfully!");
		} catch (error) {
			console.error("Error changing password: ", error);
			toast.error(
				"Failed to change password. Please check your current password."
			);
		}
	};

	return (
		<AnimationWrapper>
			<Toaster />
			<form
				ref={changePasswordForm}
				className="flex flex-col gap-4 items-center justify-center"
			>
				<h1 className="max-md:hidden">Change Password</h1>
				<div className="py-100 w-full md:max-w-[400px]">
					<InputBox
						name="currentPassword"
						type="password"
						className="profile-edit-input"
						placeholder="Current Password"
						icon="fi-rr-unlock"
					/>
					<InputBox
						name="newPassword"
						type="password"
						className="profile-edit-input"
						placeholder="New Password"
						icon="fi-rr-unlock"
					/>

					<InputBox
						name="confirmNewPassword"
						type="password"
						className="profile-edit-input"
						placeholder="Confirm New Password"
						icon="fi-rr-unlock"
					/>

					<button
						onClick={handleSubmit}
						className="btn-dark px-10"
						type="submit"
					>
						Change Password
					</button>
				</div>
			</form>
		</AnimationWrapper>
	);
};

export default ChangePassword;
