import { CodeBoxOutput, ChecklistOutput } from "editorjs-react-renderer";

const style = {
	checklist: {
		container: {},
		item: {}, // Increased font size
		checkbox: {}, // Increased checkbox size
		label: {},
	},
};

const classes = {
	checklist: {
		container: "",
		item: "text-lg flex items-center",
		checkbox: "w-5 h-5 mr-2",
		label: "cursor-pointer",
	},
};

const CustomChecklist = ({ data }) => {
	return (
		<div className="space-y-4">
			{" "}
			{/* Add spacing between checklist items */}
			{data.items.map((item, index) => (
				<div key={index} className="flex items-center">
					<input
						type="checkbox"
						checked={item.checked}
						className="w-5 h-5 mr-2"
						readOnly
					/>
					<label className="text-lg cursor-pointer">{item.text}</label>
				</div>
			))}
		</div>
	);
};

const Code = ({ code }) => {
	return (
		<div className="bg-grey/30 p-3 pl-5 border-l-4 border-red/10">
			<pre className="whitespace-pre-wrap">
				<code>{code}</code>
			</pre>
		</div>
	);
};
const CodeB = ({ language }) => {
	return (
		<div className="bg-grey/30 p-3 pl-5 border-l-4 border-red/10">
			{language}
		</div>
	);
};

const Img = ({ url, caption }) => {
	return (
		<div className="flex flex-col items-center justify-center">
			<img
				src={url}
				alt=""
				className="w-full sm:w-[80%] md:w-[70%] lg:w-[60%] xl:w-[50%] max-w-4xl h-auto object-contain"
			/>
			{caption.length ? (
				<p className="w-full text-center my-3 md:mb-12 text-base text-dark-grey">
					{caption}
				</p>
			) : (
				""
			)}
		</div>
	);
};

const List = ({ style, items }) => {
	return (
		<ol
			className={`pl-5 ${style == "ordered" ? " list-decimal" : " list-disc"}`}
		>
			{items.map((listItem, i) => {
				return (
					<li
						key={i}
						className="my-4"
						dangerouslySetInnerHTML={{ __html: listItem }}
					></li>
				);
			})}
		</ol>
	);
};

const BlogContent = ({ block }) => {
	let { type, data } = block;
	if (type == "paragraph") {
		return <p dangerouslySetInnerHTML={{ __html: data.text }}></p>;
	}

	if (type == "header") {
		if (data.level === 3) {
			return (
				<h3
					className="text-3xl font-bold"
					dangerouslySetInnerHTML={{ __html: data.text }}
				></h3>
			);
		} else if (data.level === 2) {
			return (
				<h2
					className="text-4xl font-bold"
					dangerouslySetInnerHTML={{ __html: data.text }}
				></h2>
			);
		} else if (data.level === 1) {
			return (
				<h1
					className="text-5xl font-bold"
					dangerouslySetInnerHTML={{ __html: data.text }}
				></h1>
			);
		}
	}

	if (type == "quote") {
		return (
			<div className="bg-purple/10 p-3 pl-5 border-l-4 border-purple">
				<p
					className="text-xl leading-10 md:text-2xl"
					dangerouslySetInnerHTML={{ __html: data.text }}
				></p>
				{data.caption.length ? (
					<p
						className="w-full text-purple text-base"
						dangerouslySetInnerHTML={{ __html: data.caption }}
					></p>
				) : (
					""
				)}
			</div>
		);
	}

	if (type == "code") {
		console.log(data.code);
		return <Code code={data.code} />;
	}

	if (type == "list") {
		return <List style={data.style} items={data.items} />;
	}

	if (type == "alert") {
		if (data.type == "warning") {
			return (
				<p
					className="p-5 bg-[#ff8383]/30 opacity-70 border border-[#ff8383]/70 rounded-lg text-[#ff0f0f]"
					dangerouslySetInnerHTML={{ __html: data.message }}
				></p>
			);
		}
		if (data.type == "primary") {
			return (
				<p
					className="p-5 bg-twitter/30 opacity-70 border border-twitter/70 rounded-lg text-blue-800"
					dangerouslySetInnerHTML={{ __html: data.message }}
				></p>
			);
		}
		if (data.type == "secondary") {
			return (
				<p
					className="p-5 bg-violet-500/30 opacity-70 border border-violet-500/70 rounded-lg text-violet-900"
					dangerouslySetInnerHTML={{ __html: data.message }}
				></p>
			);
		}
		if (data.type == "info") {
			return (
				<p
					className="p-5 bg-orange-500/30 opacity-70 border border-orange-500/70 rounded-lg text-orange-900"
					dangerouslySetInnerHTML={{ __html: data.message }}
				></p>
			);
		}
		if (data.type == "success") {
			return (
				<p
					className="p-5 bg-green-500/30 opacity-70 border border-green-500/70 rounded-lg text-green-900"
					dangerouslySetInnerHTML={{ __html: data.message }}
				></p>
			);
		}
		if (data.type == "danger") {
			return (
				<p
					className="p-5 bg-yellow-400 opacity-70 border-2 border-[#ff0f0f] rounded-lg text-[#ff0f0f]"
					dangerouslySetInnerHTML={{ __html: data.message }}
				></p>
			);
		}
		if (data.type == "light") {
			return (
				<p
					className="p-5 bg-slate-300 opacity-70 border border-slate-700 rounded-lg"
					dangerouslySetInnerHTML={{ __html: data.message }}
				></p>
			);
		}
		if (data.type == "dark") {
			return (
				<p
					className="p-5 bg-slate-800 opacity-70 rounded-lg text-white"
					dangerouslySetInnerHTML={{ __html: data.message }}
				></p>
			);
		}
	}

	if (type == "codeBox") {
		return (
			<div className="text-2xl">
				<CodeBoxOutput data={data} />
			</div>
		);
	}

	if (type === "checklist") {
		return <CustomChecklist data={data} />;
	}

	if (type == "image") {
		return <Img url={data.file.url} caption={data.caption} />;
	}

	if (type == "youtubeEmbed") {
		const videoId = data.url.split("v=")[1] || data.url.split("/").pop();
		return (
			<div className="relative aspect-video">
				<iframe
					className="absolute top-0 left-0 w-full h-full"
					src={`https://www.youtube.com/embed/${videoId}`}
					frameBorder="0"
					allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
					allowFullScreen
				></iframe>
			</div>
		);
	}

	return <h1>This is a block</h1>;
};

export default BlogContent;
