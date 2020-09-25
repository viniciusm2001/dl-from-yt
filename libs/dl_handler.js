const fs = require("fs");
const ytdl = require("ytdl-core");
const { exec } = require('child_process');
const FsHandler = require("./fs_handler");
const FormatsHandler = require("./formats_handler");
const Utils = require("./utils");
const emmiter = require("./emmiter");
const types = require("./constants").types;
const { DownloaderHelper } = require('node-downloader-helper');

class DlHandler {

	static async ffmpeg(command, ffmpeg_path) {
		return new Promise((resolve, reject) => {
			
			//poc == path or cmd
			const poc = ffmpeg_path ? '"' + ffmpeg_path + '"' : "ffmpeg";

			const cmd = poc + ' -y ' + command;
			
			exec(cmd, (err, stdout, stderr) => {
				if(err) {
					reject(err);
				} else {
					resolve();
				}
			})
		})
	}

	static async dl(url, dl_path, id) {
		return new Promise((resolve, reject) => {

			const dl_options = {
				fileName: Utils.getFileOrFolder(dl_path, true),
				retry: { maxRetries: 999, delay: 5000 },
				forceResume: true, 
				removeOnStop: false,
				removeOnFail: false
			};

			const dl_file = new DownloaderHelper(
				url, 
				Utils.getFileOrFolder(dl_path, false), 
				dl_options
			);
 
			dl_file
			.on('error', err => reject(err))
			.on("progress", stats => emmiter.emit("dl_status_" + id, stats))
			.on("end", () => resolve())

			dl_file
			.start()
			.catch(err => err ? null : null);

		})
	}

	static async mergeAs(merge_opt, video_path, audio_path, output_path, ffmpeg_path, audio_bitrate) {
		return new Promise(async (resolve, reject) => {

			let cmd = '-i "' + video_path + '" -i "' + audio_path + '" -c copy "' + output_path + '"';
			
			if(merge_opt){
				switch(merge_opt) {
					case "mp4_a":
						cmd = '-i "' + video_path + '" -i "' + audio_path + '" -c:v copy -c:a aac -b:a ' + audio_bitrate + 'k "' + output_path + '"';
						break;
				
					case "mp4_v":
						cmd = '-i "' + video_path + '" -i "' + audio_path + '" -c:v libx264 -c:a copy "' + output_path + '"';
						break;
				
					case "mp4_av":
						cmd = '-i "' + video_path + '" -i "' + audio_path + '" -c:v libx264 -c:a aac -b:a ' + audio_bitrate + 'k "' + output_path + '"';
						break;
				}
			}

			try {
				await this.ffmpeg(cmd, ffmpeg_path);
				await FsHandler.deleteFile(video_path);
				await FsHandler.deleteFile(audio_path);

				resolve();

			} catch (err) {
				reject(err);
			}

		})
	}

	static async convertTo(type, input_path, output_path, ffmpeg_path, audio_bitrate = null, thumbnail_url = null) {
		return new Promise(async (resolve, reject) => {

			let cmd = "";
			let temp_mp3_path = "";

			if(type === "mp4"){
				cmd = '-i "' + input_path + '" -c:v libx264 "' + output_path;

			} else {
				if(thumbnail_url){
					temp_mp3_path = Utils.changeFileExtension(input_path, "mp3");
					cmd = '-i "' + input_path + '" -b:a ' + audio_bitrate + 'k "' + temp_mp3_path + '"';

				} else {
					cmd = '-i "' + input_path + '" -b:a ' + audio_bitrate + 'k "' + output_path + '"';
				}
				
			}
			
			try {
				await this.ffmpeg(cmd, ffmpeg_path);

				if(type === "mp3"){
					if(thumbnail_url){
						cmd = '-i "' + temp_mp3_path + '" -i "' + thumbnail_url + '" -map 0:0 -map 1:0 -c copy -metadata:s:v title="Youtube video thumbnail" "' + output_path + '"';
						await this.ffmpeg(cmd, ffmpeg_path);
						await FsHandler.deleteFile(temp_mp3_path);
					}
				}

				await FsHandler.deleteFile(input_path);
				
				resolve();

			} catch (err) {
				reject(err);
			}
			

		})
	}

	

	static dlVideoAndAudio(merge_as, video_dl_url, audio_dl_url, path, id, audio_bitrate, temp_path, ffmpeg_path) {
		return new Promise(async (resolve, reject) => {
			
			let total_percentage = 0;

			emmiter.on("dl_status_" + id, dl_status => {
				dl_status.total_progress = 
					(parseInt(dl_status.progress) / 2) + total_percentage;

				Utils.emitInfo(id, "dl", dl_status);
			})

			const video_path = FsHandler.getPath(temp_path, id + ".video");
			const audio_path = FsHandler.getPath(temp_path, id + ".audio");

			try {
				Utils.emitInfo(id, "dl_start");
				Utils.emitInfo(id, "status", "Downloading video");
				await this.dl(video_dl_url, video_path, id);

				total_percentage = 50;

				Utils.emitInfo(id, "status", "Downloading audio");
				await this.dl(audio_dl_url, audio_path, id);
				Utils.emitInfo(id, "dl_end");

				total_percentage = 100;

				Utils.emitInfo(id, "status", "Merging audio and video");
				await this.mergeAs(merge_as, video_path, audio_path, path, ffmpeg_path, audio_bitrate,);

				Utils.emitInfo(id, "end", path);

				resolve();

			} catch (err) {

				if(total_percentage !== 100){
					Utils.emitInfo(id, "dl_end");
				}

				reject(err)
			}
		})

	}

	static dlAudioOrVideo(type, dl_url, path, id, convert, temp_path, ffmpeg_path, audio_bitrate = null, thumbnail_url = null) {
		return new Promise(async (resolve, reject) => {

			let downloaded = false;

			emmiter.on("dl_status_" + id, dl_status => {
				Utils.emitInfo(id, "dl", dl_status);
			})

			try {
				if(type === "video") {
					const video_path = FsHandler.getPath(temp_path, id + ".video");

					Utils.emitInfo(id, "dl_start");
					Utils.emitInfo(id, "status", "Downloading video");
					await this.dl(dl_url, video_path, id);
					Utils.emitInfo(id, "dl_end");

					downloaded = true;

					if(convert) {
						Utils.emitInfo(id, "status", "Converting to mp4");
						await this.convertTo("mp4", video_path, path, ffmpeg_path);

					} else {
						Utils.emitInfo(id, "status", "Moving file");
						await FsHandler.moveFile(video_path, path);
					}

				} else {
					const audio_path = FsHandler.getPath(temp_path, id + ".audio");
					
					Utils.emitInfo(id, "dl_start");
					Utils.emitInfo(id, "status", "Downloading audio");
					await this.dl(dl_url, audio_path, id);
					Utils.emitInfo(id, "dl_end");

					downloaded = true;

					if(convert) {
						Utils.emitInfo(id, "status", "Converting to mp3");
						await this.convertTo("mp3", audio_path, path, ffmpeg_path, audio_bitrate, thumbnail_url);

					} else {
						Utils.emitInfo(id, "status", "Moving file");
						await FsHandler.moveFile(audio_path, path);
					}
				}

				Utils.emitInfo(id, "end", path);
				
				resolve();

			} catch (err) {

				if(!downloaded){
					Utils.emitInfo(id, "dl_end");
				}

				reject(err)
			}
		})
	}

	static async downloadVideoAs(type, id, options, video_url, thumbnail_url, title, base_dl_path, temp_path, ffmpeg_path) {
		return new Promise(async (resolve, reject) => {
			try {
				Utils.emitInfo(id, "status", "Begining download");

				const { date_options, convert_to_mp3, video_quality, biggest_video } = options;
				let { convert_to_mp4 } = options;
				let merge_as = null;

				const info = await ytdl.getInfo(video_url);

				const formats = FormatsHandler.getFormats(info.formats, video_quality, biggest_video);

				const audio_container = formats.audio.container;
				const audio_bitrate = formats.audio.audioBitrate;
				const audio_dl_url = formats.audio.url;
				
				const video_container = formats.video.container;
				const video_dl_url = formats.video.url;

				if(date_options) {
					const date = await Utils.getVideoDt(info, date_options);
					title = title + date_options.title_separator + date;
				}

				let video_type = video_container;
				
				if(convert_to_mp4) {

					video_type = "mp4";
					
					if(type === types.VIDEO_ONLY){

						if(video_container === "mp4"){
							convert_to_mp4 = false;
						}

					} else {
						if(type === types.AUDIO_AND_VIDEO){
							merge_as = "mp4_";

							if(video_container !== audio_container){

								if(audio_container !== "mp4"){
									merge_as += "a";
								} else {
									merge_as += "v";
								}

							} else {
								if(video_container === "webm"){
									merge_as += "av";
								} else {
									merge_as = null;
								}
							}
						}
					}

				} else {
					if(type === types.AUDIO_AND_VIDEO){
						if(video_container !== audio_container){
							video_type = "mkv";
						}
					}
				}

				const video_dl_path = FsHandler.getPath(base_dl_path, title + "." + video_type);
				const audio_dl_path = FsHandler.getPath(base_dl_path, title + "." + (convert_to_mp3 ? "mp3" : (audio_container === "mp4" ? "m4a" : "webm")));

				switch(type) {
					case types.AUDIO_AND_VIDEO:
						await this.dlVideoAndAudio(merge_as, video_dl_url, audio_dl_url, video_dl_path, id, audio_bitrate, temp_path, ffmpeg_path);
						break;
				
					case types.VIDEO_ONLY:
						await this.dlAudioOrVideo("video", video_dl_url, video_dl_path, id, convert_to_mp4, temp_path, ffmpeg_path);
						break;
				
					case types.AUDIO_ONLY:
						await this.dlAudioOrVideo("audio", audio_dl_url, audio_dl_path, id, convert_to_mp3, temp_path, ffmpeg_path, audio_bitrate, thumbnail_url);
						break;
				}
				
				resolve();

			} catch (err) {
				reject(err);
			}
		})
	}
}

module.exports = DlHandler;