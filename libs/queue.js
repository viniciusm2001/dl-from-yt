const FsHandler = require("./fs_handler");
const DlHandler = require("./dl_handler");
const Utils = require("./utils");
const constants = require("./constants");

const queueFor = async (queue_type, type, options, base_dl_path, videos_info, retried, ffmpeg_path) => {

   return new Promise(async (resolve, reject) => {
		
		const queue_id = videos_info.queue_id;
		const playlist_title = typeof videos_info.title === "string" ? videos_info.title : null;
		const videos_length = videos_info.items.length;
		const is_retry_enabled = options.retry;
		
		const { 
			index_separator, 
			max_downloading, 
			add_video_thumbnail_to_mp3, 
			check_if_file_exists,
			log_already_downloaded
		} = options;

      let errors = [];
      let downloading = 0;
      let index = 0;
      let ended_downloads = 0;
		let retry = false;
		let queue_temp_path = "";

      const queue_to_download = async () => {

			const dl_status = {
				downloaded: ended_downloads,
				remaining: videos_length - ended_downloads,
				being_downloaded: downloading,
				total: videos_length
			}
			
			Utils.emitQueueInfo(queue_id, "dl", dl_status);
			let removed_from_downloading = false;
			
			
         if(downloading < max_downloading){

            downloading += 1;

            if(index < videos_length){
					
					//vi == video index
					const vi = index;

					index += 1;

					const log_title = videos_info.items[vi].title;
					
					const video_url = videos_info.items[vi].url_simple;
					const id = videos_info.items[vi].id;
					const video_was_downloaded = videos_info.items[vi].downloaded;
					let thumbnail_url = null;
					let can_dl_video = true;

					if(type === constants.types.AUDIO_ONLY){
						if(add_video_thumbnail_to_mp3){
							thumbnail_url = videos_info.items[vi].thumbnail;
						}
					}
					
					let title = Utils.getStrClean(videos_info.items[vi].title);

					if(index_separator){
						title = (vi + 1) + index_separator + title;
					}

					if(video_was_downloaded){
						can_dl_video = false;

					} else {

						if(!retried){
							Utils.emitInfo(id, "start");
						
							if(check_if_file_exists){
								if(await FsHandler.fileExists(base_dl_path, Utils.getStrClean(log_title))){
									
									can_dl_video = false;
									
									videos_info.items[vi].downloaded = true;

									Utils.emitInfo(id, "status", "File has already been downloaded");
									Utils.emitInfo(id, "end");

									if(log_already_downloaded) {
										console.log("'" + log_title + "' has already been downloaded");
									}

								}
							}
						}
					}
					
					if(can_dl_video){

						queue_to_download();

						console.log("Now downloading '" + log_title + "'")
						
						try {
							await DlHandler.downloadVideoAs(
								type,
								id,
								options,
								video_url,
								thumbnail_url,
								title, 
								base_dl_path,
								queue_temp_path,
								ffmpeg_path
							)
							
							videos_info.items[vi].downloaded = true;

							console.log("'" + log_title + "' downloaded successfully!")

						} catch(err) {

							let is_retry_err = false;

							Utils.emitInfo(id, "err", err.message);

							if(is_retry_enabled){

								if(err.message === constants.errors.GET_DT){
									retry = true;
									is_retry_err = true;
								}
								
								if(err.message.includes("JSON")){
									err = new Error(constants.errors.JSON);
									retry = true;
									is_retry_err = true;
								}
							}

							if(!is_retry_err){
								videos_info.items[vi].downloaded = true;
								Utils.emitInfo(id, "end");
							}
							
							const error = "Could't download '" + log_title + "' > " + err.message;

							console.error(error);

							errors.push(error);
						}
					}

					ended_downloads += 1;

					downloading -= 1;

					removed_from_downloading = true
					
					queue_to_download();

            } else {
					
               if(ended_downloads === videos_length){
						let status = "";

                  if(errors.length === 0){
							
							if(queue_type === "video"){
								status = "Video(s) downloaded successfully";
							} else {
								status = "'" + playlist_title + "' downloaded successfully";
							}

							Utils.emitQueueInfo(queue_id, "status", status);
                     
						   console.log("\n" + status);

                  } else {
							
							if(queue_type === "video"){
								status = "Video(s) downloaded with " + errors.length + " errors";
							} else {
								status = "'" + playlist_title + "' downloaded with " + errors.length + " errors";
							}
							
							Utils.emitQueueInfo(queue_id, "status", status);
							Utils.emitQueueInfo(queue_id, "err", errors);

							console.error("\n" + status + "\n");

                     for(let i = 0; i < errors.length; i++){
                        console.error(errors[i] + "\n");
                     }
						}
						
						await FsHandler.deleteFolderAndFilesInside(queue_temp_path);

                  if(!retry){
							resolve();

                  } else {
							let retry_err = new Error(constants.errors.RETRY);
							retry_err.videos_info = videos_info;
                     reject(retry_err);
                  }
               }
				}
				
				if(!removed_from_downloading){
					downloading -= 1;
				}
			}
      }

		try {
			await FsHandler.createFolder(base_dl_path);
			queue_temp_path = await FsHandler.getQueueTempPath();
			queue_to_download();

		} catch (err) {
			reject(err);
		}
   })
}

module.exports = queueFor;