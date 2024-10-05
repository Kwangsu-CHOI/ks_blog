export const getDay = (timestamp) => {
	if (!timestamp) {
		console.error("Invalid timestamp:", timestamp);
		return "Invalid date";
	}

	let date;
	if (timestamp instanceof Date) {
		date = timestamp;
	} else if (timestamp.seconds) {
		// Firestore Timestamp 객체 처리
		date = new Date(timestamp.seconds * 1000);
	} else if (typeof timestamp === "number") {
		date = new Date(timestamp);
	} else {
		console.error("Unrecognized timestamp format:", timestamp);
		return "Invalid date";
	}

	let day = date.getDate();
	let month = date.getMonth();
	let year = date.getFullYear();

	let months = [
		"Jan",
		"Feb",
		"Mar",
		"Apr",
		"May",
		"Jun",
		"Jul",
		"Aug",
		"Sep",
		"Oct",
		"Nov",
		"Dec",
	];

	return `${day} ${months[month]} ${year}`;
};

export const getFullDay = (timestamp) => {
	if (!timestamp) {
		console.error("Invalid timestamp:", timestamp);
		return "Invalid date";
	}

	let date;
	if (timestamp instanceof Date) {
		date = timestamp;
	} else if (timestamp.seconds) {
		// Firestore Timestamp 객체 처리
		date = new Date(timestamp.seconds * 1000);
	} else if (typeof timestamp === "number") {
		date = new Date(timestamp);
	} else {
		console.error("Unrecognized timestamp format:", timestamp);
		return "Invalid date";
	}

	const options = {
		weekday: "long",
		year: "numeric",
		month: "long",
		day: "numeric",
	};

	return date.toLocaleDateString("ko-KR", options);
};
