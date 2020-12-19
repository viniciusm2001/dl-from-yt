const ytdl = require("ytdl-core");
const { exec } = require('child_process');
const FsHandler = require("./fs_handler");
const FormatsHandler = require("./formats_handler");
const Utils = require("./utils");
const emmiter = require("./emmiter");
const types = require("./constants").types;
const { DownloaderHelper } = require('node-downloader-helper');

class DlHandler {

	static async ffmpeg(command) {
		return new Promise((resolve, reject) => {
			
			const ffmpeg_path = require('ffmpeg-static');
			const cmd = '"' + ffmpeg_path + '"' + ' -y ' + command;
			
			exec(cmd, (err, stdout, stderr) => {
				if(err) {
					reject(err);
				} else {
					resolve();
				}
			})
		})
	}

	static async ffprobe(file_path) {
		return new Promise(async (resolve, reject) => {
			
			const ffprobe_path = require('ffprobe-static').path;
			
			try {
				const info = await require("ffprobe")(file_path, {path: ffprobe_path});
				resolve(info);

			} catch(err) {
				reject(err);
			}
		})
	}

	static async get_stream_index(file_path, audio_or_video, file_info) {
		return new Promise(async (resolve, reject) => {
			
			const get_as_str = (txt) => {
				return (txt + "").toLowerCase();
			}

			try {
				const info = await this.ffprobe(file_path);
				
				if(info.streams.length > 1){
					
					let index = -1;

					if(audio_or_video === "audio"){
						const audio_codec = get_as_str(file_info.audioCodec);
						const sample_rate = parseInt(file_info.audioSampleRate);

						for(let i = 0; i < info.streams.length; i++){
	
							if(info.streams[i].codec_type == "audio"){
								if(get_as_str(getinfo.streams[i].codec_name) === audio_codec){
									if(parseInt(info.streams[i].sample_rate) === sample_rate){
										index = info.streams[i].index;
										break
									}
								}
							}
	
						}
	
					} else {

						const itag = parseInt(file_info.itag);
						const bitrate = parseInt(file_info.bitrate);

						for(let i = 0; i < info.streams.length; i++){

							if(info.streams[i].codec_type == "video"){
								if(parseInt(info.streams[i].tags.id) === itag){
									if(parseInt(info.streams[i].tags.variant_bitrate) === bitrate){
										index = info.streams[i].index;
										break;
									}
								}
							}
	
						}
					}

					index == -1 ? 
						reject(new Error("Unable to find " + audio_or_video + " stream index")) : 
						resolve(index);

				} else {
					resolve(0);
				}

			} catch(err) {
				reject(err);
			}
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

	static async saveThumbnail(base_thumbnail_url, get_best_thumbnail, dl_path) {
		
		const check_thumbnail = async (url, save) => {
			return new Promise (async (resolve) => {
				
				let temp_folder = ""
				let temp_file = "";
				
				if(!save){
					temp_folder = await FsHandler.getTempPath();
					temp_file = Utils.getRandId();
				}

				let ended = false;

				const end = async (boolean) => {
					if(!ended) {

						ended = true;

						try {
							await FsHandler.deleteFolderAndFilesInside(temp_folder);
							resolve(boolean);

						} catch (err) {
							resolve(boolean);
						}
						
					}
				}

				const dl_options = {
					fileName: save ? Utils.getFileOrFolder(dl_path, true) : temp_file,
					retry: { maxRetries: 999, delay: 5000 },
					forceResume: true,
					removeOnStop: false,
					removeOnFail: false
				};

				const dl_file = new DownloaderHelper(
					url, 
					save ? Utils.getFileOrFolder(dl_path, false) : temp_folder, 
					dl_options
				);
	
				dl_file
				.on('error', async () => {

					dl_file.stop();
					save ? resolve() : await end(false);
					
				})
				.on("end", async () => {
					
					dl_file.stop();
					save ? resolve() : await end(true);
					
				})

				dl_file
				.start()
				.catch(err => err ? null : null);
			})
		}

		let best_thumbnail = "";

		if(get_best_thumbnail){

			let jpgs_names = [
				"maxresdefault.jpg", "sddefault.jpg", 
				"hqdefault.jpg", "mqdefault.jpg"
			];

			const regex = new RegExp(jpgs_names.join("|"), "g");

			for(let o = 0; o < jpgs_names.length; o++){

				best_thumbnail = 
					base_thumbnail_url.replace(regex, jpgs_names[o]);

				const is_thumbnail_ok = await check_thumbnail(best_thumbnail);

				if(is_thumbnail_ok) {
					break;
				}
			}

		} else {
			best_thumbnail = base_thumbnail_url;
		}
		
		await check_thumbnail(best_thumbnail, true);

		return;
	}

	static async mergeAs(merge_opt, video_path, audio_path, output_path, audio_kbps, vsi, asi) {
		return new Promise(async (resolve, reject) => {

			let cmd = '-i "' + video_path + '" -i "' + audio_path + '" -map 0:' + 
				vsi + ' -map 1:' + asi + ' -c copy -shortest "' + output_path + '"';
			
			if(merge_opt){
				switch(merge_opt) {
					case "mp4_a":
						cmd = '-i "' + video_path + '" -i "' + audio_path + '" -map 0:' + 
							vsi + ' -map 1:' + asi + ' -c:v copy -c:a aac -b:a ' + audio_kbps + 'k -shortest "' + output_path + '"';
						break;
				
					case "mp4_v":
						cmd = '-i "' + video_path + '" -i "' + audio_path + '" -map 0:' + 
							vsi + ' -map 1:' + asi + ' -c:v libx264 -c:a copy -shortest "' + output_path + '"';
						break;
				
					case "mp4_av":
						cmd = '-i "' + video_path + '" -i "' + audio_path + '" -map 0:' + 
							vsi + ' -map 1:' + asi + ' -c:v libx264 -c:a aac -b:a ' + audio_kbps + 'k -shortest "' + output_path + '"';
						break;
				}
			}

			try {
				await this.ffmpeg(cmd);
				await FsHandler.deleteFile(video_path);
				await FsHandler.deleteFile(audio_path);

				resolve();

			} catch (err) {
				reject(err);
			}

		})
	}

	static async convertTo(type, input_path, output_path, audio_kbps, si, thumbnail_url = null, best_mp3_thumbnails = null) {
		return new Promise(async (resolve, reject) => {

			let cmd = "";
			let temp_mp3_path = "";

			if(type === "mp4"){
				cmd = '-i "' + input_path + '" -map 0:' + si + ' -c:v libx264 -an "' + output_path + '"';

			} else {
				if(thumbnail_url){
					temp_mp3_path = Utils.changeFileExtension(input_path, "mp3");
					cmd = '-i "' + input_path + '" -map 0:' + si + ' -b:a ' + audio_kbps + 'k "' + temp_mp3_path + '"';

				} else {
					cmd = '-i "' + input_path + '" -map 0:' + si + ' -b:a ' + audio_kbps + 'k "' + output_path + '"';
				}
			}
			
			try {
				await this.ffmpeg(cmd);

				if(type === "mp3"){
					if(thumbnail_url){

						const thumbnail_path = Utils.changeFileExtension(input_path, "jpg");

						await this.saveThumbnail(
							thumbnail_url, 
							best_mp3_thumbnails, 
							thumbnail_path
						);

						cmd = '-i "' + temp_mp3_path + '" -i "' + thumbnail_path + '" -map 0:0 -map 1:0 -c copy -metadata:s:v title="YT video thumbnail" "' + output_path + '"';
						
						while(
							!(await FsHandler.fileExists(
								Utils.getFileOrFolder(thumbnail_path, false),
								Utils.getFileOrFolder(thumbnail_path, true)
							))
						){
							await Utils.sleep(500);
						}

						await this.ffmpeg(cmd);
						
						await FsHandler.deleteFile(thumbnail_path);
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

	

	static dlVideoAndAudio(merge_as, video_dl_url, audio_dl_url, path, id, temp_path, video, audio) {
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

				//video stream index
				const vsi = await this.get_stream_index(video_path, "video", video);

				total_percentage = 50;

				Utils.emitInfo(id, "status", "Downloading audio");
				await this.dl(audio_dl_url, audio_path, id);
				Utils.emitInfo(id, "dl_end");

				total_percentage = 100;

				//audio stream index
				const asi = await this.get_stream_index(audio_path, "audio", audio);

				Utils.emitInfo(id, "status", "Merging audio and video");
				await this.mergeAs(merge_as, video_path, audio_path, path, audio.audioBitrate, vsi, asi);

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

	static dlAudioOrVideo(type, dl_url, path, id, temp_path, file, thumbnail_url = null, best_mp3_thumbnails = null) {
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
					
					//video stream index
					const vsi = await this.get_stream_index(video_path, "video", file);

					Utils.emitInfo(id, "status", "Converting to mp4");
					await this.convertTo("mp4", video_path, path, null, vsi);					

				} else {
					const audio_path = FsHandler.getPath(temp_path, id + ".audio");
					
					Utils.emitInfo(id, "dl_start");
					Utils.emitInfo(id, "status", "Downloading audio");
					await this.dl(dl_url, audio_path, id);
					Utils.emitInfo(id, "dl_end");

					downloaded = true;

					//audio stream index
					const asi = await this.get_stream_index(audio_path, "audio", file);
					
					Utils.emitInfo(id, "status", "Converting to mp3");
					await this.convertTo("mp3", audio_path, path, file.audioBitrate, asi, thumbnail_url, best_mp3_thumbnails);
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

	static async downloadVideoAs(type, id, options, video_url, thumbnail_url, title, base_dl_path, temp_path) {
		return new Promise(async (resolve, reject) => {
			try {
				Utils.emitInfo(id, "status", "Begining download");

				const { date_options, video_quality, biggest_video, best_mp3_thumbnails } = options;
				let { convert_to_mp4 } = options;
				let merge_as = null;

				const info = await ytdl.getInfo(video_url);

				const { audio, video } = FormatsHandler.getFormats(info.formats, video_quality, biggest_video);

				if(date_options) {
					const date = await Utils.getVideoDt(info, date_options);
					title = title + date_options.title_separator + date;
				}

				let video_type = video.container;
				
				if(type === types.VIDEO_ONLY){
					video_type = "mp4";
				
				} else {

					if(convert_to_mp4) {

						video_type = "mp4";
						
						if(type === types.AUDIO_AND_VIDEO){
							merge_as = "mp4_";
	
							if(video.container !== audio.container){
	
								if(audio.container !== "mp4"){
									merge_as += "a";
								}
								
								if(video.container !== "mp4"){
									merge_as += "v";
								}
	
							} else {
								if(video.container === "mp4"){
									merge_as = null;
								} else {
									merge_as += "av";
								}
							}
						}
	
					} else {
						if(type === types.AUDIO_AND_VIDEO){
							if(video.container !== audio.container){
								video_type = "mkv";
							}
						}
					}
				}

				const video_dl_path = FsHandler.getPath(base_dl_path, title + "." + video_type);
				const audio_dl_path = FsHandler.getPath(base_dl_path, title + "." + "mp3");

				switch(type) {
					case types.AUDIO_AND_VIDEO:
						await this.dlVideoAndAudio(merge_as, video.url, audio.url, video_dl_path, id, temp_path, video, audio);
						break;
				
					case types.VIDEO_ONLY:
						await this.dlAudioOrVideo("video", video.url, video_dl_path, id, temp_path, video);
						break;
				
					case types.AUDIO_ONLY:
						await this.dlAudioOrVideo("audio", audio.url, audio_dl_path, id, temp_path, audio, thumbnail_url, best_mp3_thumbnails);
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