import Embed from "@editorjs/embed";
import List from "@editorjs/list";
import Image from "@editorjs/image";
import Header from "@editorjs/header";
import Quote from "@editorjs/quote";
import Marker from "@editorjs/marker";
import Paragraph from "@editorjs/paragraph";
import Alert from "editorjs-alert";
import Checklist from "@editorjs/checklist";
import YoutubeEmbed from "editorjs-youtube-embed";

import AlignmentTuneTool from "editorjs-text-alignment-blocktune";

import InlineCode from "@editorjs/inline-code";
import CodeBox from "@bomdi/codebox";

import { uploadImage } from "../firebase/firestore-operations";

export const tools = (userAuth) => {
	const uploadImageByFile = (e) => {
		const userId = userAuth?.id;

		const tempBlogId = Date.now().toString();
		const path = `blog_images/${userId}/${tempBlogId}/${e.name}`;
		return uploadImage(e, path).then((url) => {
			if (url) {
				return {
					success: 1,
					file: { url },
				};
			}
		});
	};

	const uploadImageByUrl = (e) => {
		let link = new Promise((resolve, reject) => {
			try {
				resolve(e);
			} catch (error) {
				reject(error);
			}
		});

		return link.then((url) => {
			return {
				success: 1,
				file: { url },
			};
		});
	};

	return {
		embed: Embed,
		paragraph: {
			class: Paragraph,
			inlineToolbar: true,
			tunes: ["textTune"],
		},
		list: {
			class: List,
			tunes: ["textTune"],
			inlineToolbar: true,
		},
		image: {
			class: Image,
			config: {
				uploader: {
					uploadByUrl: uploadImageByUrl,
					uploadByFile: uploadImageByFile,
				},
			},
		},
		header: {
			class: Header,
			tunes: ["textTune"],
			config: {
				placeholder: "Type Heading...",
				levels: [1, 2, 3],
				defaultLevel: 2,
			},
		},
		quote: { class: Quote, inlineToolbar: true },
		marker: Marker,
		// code: { class: Code },
		inlineCode: InlineCode,
		codeBox: {
			class: CodeBox,
			config: {
				themeURL:
					"https://cdn.jsdelivr.net/gh/highlightjs/cdn-release@9.18.1/build/styles/dracula.min.css", // Optional
				themeName: "atom-one-dark", // Optional
				useDefaultTheme: "light", // Optional. This also determines the background color of the language select drop-down
			},
		},
		textTune: {
			class: AlignmentTuneTool,
			config: {
				default: "left",
				blocks: {
					header: "center",
					list: "left",
					paragraph: "left",
				},
			},
		},
		alert: {
			class: Alert,
			tunes: ["textTune"],
			inlineToolbar: true,
			shortcut: "CMD+SHIFT+A",
			config: {
				alertTypes: [
					"primary",
					"secondary",
					"info",
					"success",
					"warning",
					"danger",
					"light",
					"dark",
				],
				defaultType: "primary",
				messagePlaceholder: "Enter something",
			},
		},
		checklist: {
			class: Checklist,
			inlineToolbar: true,
		},
		youtubeEmbed: YoutubeEmbed,
	};
};
