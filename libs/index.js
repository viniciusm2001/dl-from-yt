const FsHandler = require("./fs_handler");
const Utils = require("./utils");
const queueFor = require("./queue");
const emmiter = require("./emmiter");
const constants = require("./constants");

class DlFromYT {

   static async getOptions(){
      return FsHandler.getOptions();
   }

   static async setOptions(json){
      return FsHandler.setOptions(json);
	}

   static async setDefaultOptions(){
      return FsHandler.setDefaultOptions();
	}

   static async cleanTemp(){
      return FsHandler.cleanTemp();
	}
	
	static async getVideosInfo(urls){
		return Utils.infoVideos(urls);
	}
	
	static async getPlaylistVideosInfo(url){
		return Utils.infoPlaylist(url);
	}

	static getStrClean(string){
		return Utils.getStrClean(string);
	}

	static listener = emmiter;

	static types = constants.types;
	
   static available_formats = constants.AVAILABLE_FORMATS;

	static default_options = constants.DEFAULT_OPTIONS_JSON;

   static checkType(type){
      return new Promise((resolve, reject) => {
         let is_valid = false;
         const types = this.types;

         for(let key in types){
            if(types[key] === type){
					is_valid = true;
					break;
            }
         }

         is_valid ? resolve() : reject(new Error("Invalid type"));
      })
	}
	
	static download(queue_type, type, options, videos, dl_path, custom_dl_folder, ffmpeg_path){
		
		return new Promise(async (resolve, reject) => {
			let retried = 0;
			let retry = true;

			const console_log_dl_info = () => {

				console.log("\n-----------------------------------------------------------------------")

				if(queue_type === "playlist"){
					if(retried === 0){
						console.log("Now downloading the playlist '" + videos.title + "'\n");
					} else {
						console.log("Now retring the playlist '" + videos.title + "' download\n");
					}

				} else {
					if(retried === 0){
						console.log("Now downloading videos\n");
					} else {
						console.log("Now retring the videos download\n");
					}
				}
			}

			try {
				const { max_retries, retry_wait_time } = options;
				const queue_id = videos.queue_id;

				if(!custom_dl_folder){
					await FsHandler.createFolderStructure();
				}

				Utils.emitQueueInfo(queue_id, "start");

				if(!custom_dl_folder){
					Utils.emitQueueInfo(queue_id, "folder_path", dl_path);
				}

				while(retry){
					try {
						console_log_dl_info();

						await queueFor(
							queue_type,
							type,
							options,
							dl_path,
							videos,
							retried === 0 ? false : true,
							ffmpeg_path
						);

						retry = false;
						
						Utils.emitQueueInfo(queue_id, "end");
						
						resolve();

					} catch(err) {
						if(err.message === constants.errors.RETRY){

							if(retried < max_retries){
								await Utils.sleep(retry_wait_time)
								retried += 1;
								videos = err.videos_info;
								Utils.emitQueueInfo(queue_id, "restart");

							} else {
								retry = false;
								Utils.endAll(queue_id, err.videos_info.items)
								reject(new Error("Maximum retry limit reached"))
							}

						} else {
							retry = false;
							Utils.emitQueueInfo(queue_id, "end");
							reject(err)
						}
					}
				}
			} catch(err) {
				reject(err)
			}
		})
		
	}

	static async videos(type, videos_info, urls = null, custom_dl_folder = null, custom_options = null, ffmpeg_path = null){
      return new Promise(async (resolve, reject) => {
			try {
				await this.checkType(type);

				const options = custom_options ? custom_options : await FsHandler.getOptions();

				const videos = urls ? await Utils.infoVideos(urls) : videos_info;

				const dl_path = custom_dl_folder ? custom_dl_folder : 
					FsHandler.getPathWithDFP("videos", type);

				await this.download(
					"video", 
					type, 
					options, 
					videos, 
					dl_path,
					custom_dl_folder,
					ffmpeg_path
				)
						
				resolve();

			} catch(err) {
				reject(err);
			}
      })
   }

   static async playlist(type, playlist_videos_info, url = null, custom_dl_folder = null, custom_options = null, ffmpeg_path = null){
      return new Promise(async (resolve, reject) => {
			try {
				await this.checkType(type);

				const options = custom_options ? custom_options : await FsHandler.getOptions();

				const videos = url ? await Utils.infoPlaylist(url) : playlist_videos_info;
				
				const playlist_dl_path = custom_dl_folder ? custom_dl_folder : 
					FsHandler.getPathWithDFP(
						"playlists",
						type,
						Utils.getStrClean(videos.title)
					);
				
				await this.download(
					"playlist", 
					type, 
					options, 
					videos, 
					playlist_dl_path,
					custom_dl_folder,
					ffmpeg_path
				)

				resolve();

			} catch(err) {
				reject(err);
			}
      })
   }
}

module.exports = DlFromYT;
