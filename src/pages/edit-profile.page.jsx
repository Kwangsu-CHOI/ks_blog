import React, { useContext, useEffect, useRef, useState } from "react";
import {
	uploadImage,
	updateUser,
	getUser,
} from "../firebase/firestore-operations";
import { auth } from "../firebase/firebase";
import AnimationWrapper from "../common/page-animation";
import InputBox from "../components/input.component";
import { toast, Toaster } from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { useRecoilState } from "recoil";
import { userAuthState } from "../recoil/atoms";

const EditProfile = () => {
	const [userAuth, setUserAuth] = useRecoilState(userAuthState);
	const [username, setUsername] = useState(userAuth.personal_info?.username);
	const [name, setName] = useState(userAuth.personal_info?.fullname);
	const [bio, setBio] = useState(userAuth.personal_info?.bio);
	const [profileImg, setProfileImg] = useState(
		userAuth.personal_info?.profile_img
	);
	const [socialLinks, setSocialLinks] = useState(
		userAuth.social_links || {
			youtube: "",
			instagram: "",
			facebook: "",
			twitter: "",
			github: "",
			website: "",
		}
	);
	const [charactersLeft, setCharactersLeft] = useState(250);
	const [updatedProfileImg, setUpdatedProfileImg] = useState(null);

	const navigate = useNavigate();
	const profileImgRef = useRef();

	useEffect(() => {
		if (userAuth.id) {
			getUser(userAuth.id).then((user) => {
				if (user) {
					setName(user.personal_info?.fullname || "");
					setBio(user.personal_info?.bio || "");
					setProfileImg(user.personal_info?.profile_img || "");
					setSocialLinks(
						user.social_links || {
							youtube: "",
							instagram: "",
							facebook: "",
							twitter: "",
							github: "",
							website: "",
						}
					);
					setUsername(user.personal_info?.username || "");
					setCharactersLeft(150 - (user.personal_info?.bio?.length || 0));
				}
			});
		}
	}, [userAuth.id]);

	const handleImagePreview = (e) => {
		let img = e.target.files[0];
		setUpdatedProfileImg(img);
		profileImgRef.current.src = URL.createObjectURL(img);
	};

	useEffect(() => {
		console.log("profileImg updated:", profileImg);
	}, [profileImg]);

	const handleImageUpload = async (e) => {
		e.preventDefault();
		if (!updatedProfileImg) return;

		let loadingToast = toast.loading("Uploading...");
		try {
			const oldImageUrl = userAuth.personal_info.profile_img;

			const path = `profile/${userAuth.id}/profile-image`;
			const url = await uploadImage(updatedProfileImg, path);
			setProfileImg(url);
			setUpdatedProfileImg(null);
			toast.dismiss(loadingToast);
			toast.success("Image uploaded successfully");
			console.log("Uploaded image URL:", url);

			if (oldImageUrl && oldImageUrl !== url) {
				try {
					await deleteImage(oldImageUrl);
				} catch (deleteErr) {
					console.error("Previous image deletion failed:", deleteErr);
				}
			}

			// 상태 업데이트 후 handleSubmit 호출
			setTimeout(() => handleSubmit(e), 0);
		} catch (err) {
			toast.dismiss(loadingToast);
			toast.error("이미지 업로드 실패: " + err.message);
		}
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		if (username.length < 3) {
			return toast.error("Username should be at least 3 characters long");
		}
		if (bio.length > 150) {
			return toast.error("Bio cannot be more than 150 characters");
		}

		let loadingToast = toast.loading("업데이트 중...");
		try {
			// 최신 profileImg 값을 사용하기 위해 콜백 사용
			setProfileImg((currentProfileImg) => {
				const updateData = {
					personal_info: {
						fullname: name,
						bio: bio,
						profile_img: currentProfileImg,
						username: username,
						email: userAuth.personal_info.email,
						total_posts: userAuth.personal_info.total_posts,
					},
					social_links: socialLinks,
				};

				console.log("Updating user with data:", updateData);
				updateUser(userAuth.id, updateData)
					.then(() => {
						toast.dismiss(loadingToast);
						toast.success("Profile updated successfully");
						setUserAuth((prev) => ({
							...prev,
							personal_info: {
								...prev.personal_info,
								...updateData.personal_info,
							},
							social_links: updateData.social_links,
						}));
					})
					.catch((err) => {
						toast.dismiss(loadingToast);
						toast.error("Profile update failed: " + err.message);
					});

				return currentProfileImg;
			});
		} catch (err) {
			toast.dismiss(loadingToast);
			toast.error("프로필 업데이트 실패: " + err.message);
		}
	};

	const handleNameChange = (e) => {
		const newName = e.target.value;
		setName(newName);
	};

	const handleUsernameChange = (e) => {
		const newUsername = e.target.value;
		setUsername(newUsername);
	};

	const handleSocialLinkChange = (key, value) => {
		setSocialLinks((prev) => ({
			...prev,
			[key]: value,
		}));
	};

	const handleBioChange = (e) => {
		const newBio = e.target.value;
		setBio(newBio);
		setCharactersLeft(250 - newBio.length);
	};

	return (
		<AnimationWrapper>
			<Toaster />
			<form onSubmit={handleSubmit}>
				<h1 className="max-md:hidden">Edit Profile</h1>
				<div className="flex flex-col lg:flex-row items-start py-10 gap-8 lg:gap-10">
					<div className="max-lg:center mb-5">
						<label
							htmlFor="profileImg"
							className="relative block w-48 h-48 bg-grey rounded-full overflow-hidden"
						>
							<div className="w-full h-full absolute top-0 left-0 flex items-center justify-center text-white bg-black/30 opacity-0 hover:opacity-100 cursor-pointer">
								Upload Image
							</div>
							<img
								ref={profileImgRef}
								src={profileImg}
								className="w-full h-full object-cover"
								alt="Profile"
							/>
						</label>
						<input
							type="file"
							id="profileImg"
							accept=".jpeg, .png, .jpg"
							hidden
							onChange={handleImagePreview}
						/>
						<button
							className="btn-light mt-5 max-lg:center lg:w-full px-10"
							onClick={handleImageUpload}
						>
							Upload
						</button>
					</div>
					<div className="w-full">
						<InputBox
							name="fullname"
							type="text"
							value={name}
							placeholder="Full Name"
							icon="fi-rr-user"
							onChange={handleNameChange}
							onBlur={handleNameChange}
						/>
						<InputBox
							name="username"
							type="text"
							value={username}
							placeholder="Username"
							icon="fi-rr-at"
							onChange={handleUsernameChange}
							onBlur={handleUsernameChange}
						/>
						<p className="text-dark-grey -mt-3">
							Username will be used to search user and will be visible to all
							users
						</p>
						<textarea
							name="bio"
							value={bio}
							className="input-box h-64 lg:h-40 resize-none leading-7 mt-5 pl-5"
							placeholder="Bio"
							onChange={handleBioChange}
							onBlur={handleBioChange}
						></textarea>
						<p className="mt-1 text-dark-grey">
							{charactersLeft} Characters Left
						</p>
						<p className="my-6 text-dark-grey">Add your social links below</p>
						<div className="md:grid md:grid-cols-2 gap-x-6">
							{Object.keys(socialLinks).map((key, i) => (
								<InputBox
									key={i}
									name={key}
									type="text"
									value={socialLinks[key]}
									placeholder={`https://${key}.com/`}
									icon={`fi ${
										key !== "website" ? `fi-brands-${key}` : "fi-rr-globe"
									}`}
									onChange={(e) => handleSocialLinkChange(key, e.target.value)}
									onBlur={(e) => handleSocialLinkChange(key, e.target.value)}
								/>
							))}
						</div>
						<button className="btn-dark px-10" type="submit">
							Update
						</button>
					</div>
				</div>
			</form>
		</AnimationWrapper>
	);
};

export default EditProfile;
