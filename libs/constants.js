const path = require("path");

const constants = {

	errors: {
		GET_DT: "The fetched date is invalid, download will be retried later",
		JSON: "Unable to fetch video info, download will be retried later",
		RETRY: "Some videos where unable to be downloaded, retring now"
	},

	types: {
		AUDIO_AND_VIDEO: "audio and video",
		VIDEO_ONLY: "video only",
		AUDIO_ONLY: "audio only"
	},

	OPTIONS_PATH: path.join(__dirname, "..", "config", "options.json"),

	AVAILABLE_FORMATS: [
		{ title: "144p", value: "144p" },
		{ title: "144p 15fps", value: "144p 15fps" },
		{ title: "144p 60fps HDR", value: "144p60 HDR" },
		{ title: "240p", value: "240p" },
		{ title: "240p 60fps HDR", value: "240p60 HDR" },
		{ title: "270p", value: "270p" },
		{ title: "360p", value: "360p" },
		{ title: "360p 60fps HDR", value: "360p60 HDR" },
		{ title: "480p", value: "480p" },
		{ title: "480p 60fps HDR", value: "480p60 HDR" },
		{ title: "720p", value: "720p" },
		{ title: "720p 50fps", value: "720p50" },
		{ title: "720p 60fps", value: "720p60" },
		{ title: "720p 60fps HDR", value: "720p60 HDR" },
		{ title: "1080p", value: "1080p" },
		{ title: "1080p 60fps", value: "1080p60" },
		{ title: "1080p 60fps HDR", value: "1080p60 HDR" },
		{ title: "1440p", value: "1440p" },
		{ title: "1440p 60fps", value: "1440p60" },
		{ title: "1440p 60fps HDR", value: "1440p60 HDR" },
		{ title: "2160p", value: "2160p" },
		{ title: "2160p 60fps", value: "2160p60" },
		{ title: "2160p 60fps HDR", value: "2160p60 HDR" },
		{ title: "4320p", value: "4320p" },
		{ title: "4320p 60fps", value: "4320p60" }
	],

	DEFAULT_OPTIONS_JSON: {
		video_quality: "4320p60",
		convert_to_mp4: false,
		add_video_thumbnail_to_mp3: false,
		index_separator: null,
		date_options: {
			add_zero: false,
			index: [
				"YYYY",
				"MM",
				"DD"
			],
			separator: "-",
			title_separator: "_"
		},
		retry: true,
		max_retries: 3,
		retry_wait_time: 2000,
		check_if_file_exists: true,
		max_downloading: 10,
		biggest_video : false,
		biggest_audio : false,
		log_already_downloaded: false,
		best_mp3_thumbnails: false
	}
};

module.exports = constants;