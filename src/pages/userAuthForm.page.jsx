import React, { useRef } from "react";
import { Link, Navigate } from "react-router-dom";
import InputBox from "../components/input.component";
import googleIcon from "../imgs/google.png";
import AnimationWrapper from "../common/page-animation";
import { Toaster, toast } from "react-hot-toast";
import { useRecoilState } from "recoil";
import { userAuthState } from "../recoil/atoms";
import {
	createUser,
	signInUser,
	signInWithGoogle,
} from "../firebase/firestore-operations";

const UserAuthForm = ({ type }) => {
	const [userAuth, setUserAuth] = useRecoilState(userAuthState);
	const formElement = useRef(null);

	const userAuthThroughServer = async (formData) => {
		let { fullname, email, password } = formData;
		try {
			let userData;
			if (type === "sign-in") {
				userData = await signInUser(email, password);
			} else {
				userData = await createUser({ fullname, email, password });
			}
			setUserAuth(userData);
		} catch (error) {
			toast.error(error.message);
		}
	};

	const handleSubmit = (e) => {
		e.preventDefault();

		let emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
		let passwordRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,20}$/;

		let form = new FormData(formElement.current);
		let formData = {};

		for (let [key, value] of form.entries()) {
			formData[key] = value;
		}
		let { fullname, email, password } = formData;

		if (fullname && fullname.length < 3) {
			return toast.error("Fullname must be longer than 2 letters.");
		}
		if (!email.length) {
			return toast.error("Please enter an email");
		}
		if (!emailRegex.test(email)) {
			return toast.error("Email is invalid");
		}
		if (!passwordRegex.test(password)) {
			return toast.error(
				"Password should be 6 to 20 characters long with a numeric, 1 lowercase and 1 uppercase"
			);
		}

		userAuthThroughServer(formData);
	};

	const handleGoogleAuth = async (e) => {
		e.preventDefault();
		try {
			const userData = await signInWithGoogle();
			setUserAuth(userData);
		} catch (error) {
			console.error("Google Sign In Error:", error);
			toast.error("Error while logging with Google");
		}
	};

	return userAuth ? (
		<Navigate to="/" />
	) : (
		<AnimationWrapper keyValue={type}>
			<section className="h-cover flex items-center justify-center">
				<Toaster />
				<form ref={formElement} className="w-[80%] max-w-[400px]">
					<h1 className="text-4xl font-gelasio capitalize text-center mb-24">
						{type === "sign-in" ? "Welcome back" : "Join us today"}
					</h1>

					{type !== "sign-in" && (
						<InputBox
							type="text"
							name="fullname"
							placeholder="Full Name"
							icon="fi-rr-user"
						/>
					)}

					<InputBox
						type="email"
						name="email"
						placeholder="Email"
						icon="fi-rr-envelope"
					/>
					<InputBox
						type="password"
						name="password"
						placeholder="Password"
						icon="fi-rr-key"
					/>

					<button
						className="btn-dark center mt-14"
						type="submit"
						onClick={handleSubmit}
					>
						{type.replace("-", " ")}
					</button>

					<div className="relative w-full flex items-center gap-2 my-10 opacity-10 uppercase text-black font-bold">
						<hr className="w-1/2 border-black" />
						<p>or</p>
						<hr className="w-1/2 border-black" />
					</div>

					<button
						className="btn-dark flex items-center justify-center gap-4 w-[90%] center"
						onClick={handleGoogleAuth}
					>
						<img src={googleIcon} className="w-5" alt="Google Icon" />
						continue with google
					</button>

					{type === "sign-in" ? (
						<p className="mt-6 text-dark-grey text-xl text-center">
							Don't have an account?
							<Link to="/signup" className="underline text-black text-xl ml-1">
								Join us today
							</Link>
						</p>
					) : (
						<p className="mt-6 text-dark-grey text-xl text-center">
							Already a member?
							<Link to="/signin" className="underline text-black text-xl ml-1">
								Sign in here
							</Link>
						</p>
					)}
				</form>
			</section>
		</AnimationWrapper>
	);
};

export default UserAuthForm;
