import { useState } from "react";

const InputBox = ({
	type,
	name,
	id,
	value,
	placeholder,
	icon,
	disable = false,
	onChange,
	onBlur,
}) => {
	const [passwordVisible, setPasswordVisible] = useState(false);
	return (
		<div className="relative w-[100%] mb-4">
			<input
				type={
					type === "password" ? (passwordVisible ? "text" : "password") : type
				}
				name={name}
				placeholder={placeholder}
				value={value}
				id={id}
				disabled={disable}
				className="input-box"
				onChange={onChange || undefined}
				onBlur={onBlur || undefined}
			/>
			<i className={"fi " + icon + " input-icon"}></i>

			{type === "password" ? (
				<i
					className={
						"fi fi-rr-eye" +
						(!passwordVisible ? "-crossed" : "") +
						" input-icon left-[auto] right-4 cursor-pointer"
					}
					onClick={() => setPasswordVisible((curVal) => !curVal)}
				></i>
			) : (
				""
			)}
		</div>
	);
};
export default InputBox;
