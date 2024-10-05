import {
	collection,
	query,
	orderBy,
	limit,
	startAfter,
	getDocs,
	where,
} from "firebase/firestore";
import { db } from "../firebase/firebase";

export const filterPaginationData = async ({
	collectionName,
	orderByField,
	limitCount,
	startAfterDoc,
	whereConditions = [],
}) => {
	let q = query(
		collection(db, collectionName),
		orderBy(orderByField, "desc"),
		limit(limitCount)
	);

	if (startAfterDoc) {
		q = query(q, startAfter(startAfterDoc));
	}

	whereConditions.forEach((condition) => {
		q = query(q, where(condition.field, condition.operator, condition.value));
	});

	const querySnapshot = await getDocs(q);
	const lastVisible = querySnapshot.docs[querySnapshot.docs.length - 1];

	const results = querySnapshot.docs.map((doc) => ({
		id: doc.id,
		...doc.data(),
	}));

	return { results, lastVisible };
};
