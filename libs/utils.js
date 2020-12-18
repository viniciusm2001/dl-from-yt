const ytdl = require("ytdl-core");
const ytpl = require("ytpl");
const emmiter = require("./emmiter");
const os = require('os');
const constants = require("./constants");

class Utils {

	static getRandId() {
		return new Date().getTime() + "" + Math.round(Math.random() * 1000000);
	}

	static sleep(milliseconds) {
		return new Promise((resolve) => {
			setTimeout(() => {
				resolve();
			}, milliseconds)
		})
	}

	static async getItemsIdsAndDlFields(items) {

		for (let i = 0; i < items.length; i++) {
			await this.sleep(1)
			items[i].id = this.getRandId();
			items[i].downloaded = false;
		}

		return items;
	}

	static getPlaylistItemsClean(items) {

		for(let i = 0; i < items.length; i++) {//console.log(items[i])

			items[i].thumbnail = this.subStringWhenCharAppears(
				"?",
				items[i].thumbnails[0].url
			);
			
			items[i].url_simple = items[i].shortUrl;

			const keys = Object.keys(items[i]);

			for(let o = 0; o < keys.length; o++){
				switch(keys[o]){
					case "id":
						break;
					case "url_simple":
						break;
					case "title":
						break;
					case "thumbnail":
						break;
					case "downloaded":
						break;
					default:
						delete items[i][keys[o]];
						break;
				}
			}
		}

		return items;
	}

	static getDtFormated(date_string, date_options) {

		const { index, separator, add_zero } = date_options;
		const date_array = date_string.split("-");
		let date_formated = "";
		
		const add_zero_to_number = (number) => {
			
			if(!add_zero){
				number = number + "";

				if(number[0] === "0") {
					number = "" + number[1];
				}
			}

			return number;
		}

		for (let i = 0; i < index.length; i++) {
			switch(index[i]) {
				case "YYYY":
					date_formated += separator + date_array[0];
					break;

				case "MM":
					date_formated += separator + add_zero_to_number(date_array[1]);
					break;

				case "DD":
					date_formated += separator + add_zero_to_number(date_array[2]);
					break;
			}
		}
      
		date_formated = date_formated.substr(1, date_formated.length - 1);

		return date_formated
	}

	static async getVideoDt(info, date_options) {
		return new Promise(async (resolve, reject) => {

			if(!info.videoDetails.publishDate) {
				reject(new Error(constants.errors.GET_DT));

			} else {
				const date_formated = this.getDtFormated(info.videoDetails.publishDate, date_options);
				resolve(date_formated);
			}
			
		})
	}

	static async infoPlaylist(url) {
		return new Promise(async (resolve, reject) => {

			try {
				let playlist = await ytpl(url, { limit: Infinity });

				playlist.queue_id = this.getRandId();
				playlist.items = await this.getItemsIdsAndDlFields(playlist.items);
				playlist.items = this.getPlaylistItemsClean(playlist.items);

				resolve(playlist);

			} catch (err) {
				reject(err);
			}
		})
	}

	static async infoVideos(urls) {
		return new Promise(async (resolve, reject) => {
			let videos = {};
			videos.queue_id = this.getRandId();
			videos.items = [];

			for (let i = 0; i < urls.length; i++) {
				try {
					const info = await ytdl.getInfo(urls[i]);
					let video = {};

					video.title = info.videoDetails.title;
					video.url_simple = urls[i];
					video.thumbnail = this.subStringWhenCharAppears(
						"?",
						info.videoDetails.thumbnail.thumbnails[0].url
					);

					videos.items.push(video);

				} catch (err) {
					reject(err);
				}
			}

			videos.items = await this.getItemsIdsAndDlFields(videos.items);

			resolve(videos);
		})
	}

	static changeFileExtension(file_path, new_extension) {
		const fp_array = file_path.split(".");

		fp_array[fp_array.length - 1] = new_extension;

		return fp_array.join(".");
	}

	static subStringWhenCharAppears(char, string) {
		let new_string = "";

		for (let i = 0; i < string.length; i++) {
			if(string[i] !== char) {
				new_string += string[i];
			} else {
				break;
			}
		}

		return new_string;
	}


	static getStrClean(string){
		string = string.replace(/[/\\?%*:|"<>.]/g, "");

		if(string.length < 5){
			if(string === ""){
				string = "-";

			} else {
				if(os.platform() === "win32"){

					let reserved_names = [
						"com0", "com1", "com2", "com3", "com4", "com5", 
						"com6", "com7", "com8", "com9", "lpt0", "lpt1", 
						"lpt2", "lpt3", "lpt4", "lpt5", "lpt6", "lpt7", 
						"lpt8", "lpt9", "aux", "con", "nul", "prn"
					];

					reserved_names = reserved_names.map(name => `^${name}$`);

					const regex = new RegExp(reserved_names.join("|"), "i")

					if(string.match(regex)){
						string = string + "-";
					}
				}
			}
		}

		return string
	}

	static removeListeners(id) {
		emmiter.removeAllListeners("dl_status_" + id);
		emmiter.removeAllListeners("info_" + id);
		return;
	}

	static emitInfo(id, type, data = null) {
		const info = {
			type,
			data
		};

		emmiter.emit("info_" + id, info);

		if(type === "end"){
			this.removeListeners(id);
		}

		return;
	}

	static removeQueueListeners(id) {
		emmiter.removeAllListeners("queue_info_" + id);
		return;
	}

	static emitQueueInfo(id, type, data = null) {
		const info = {
			type,
			data
		};

		emmiter.emit("queue_info_" + id, info);

		if(type === "end"){
			this.removeQueueListeners(id);
		}

		return;
	}

	static endAll(queue_id, items){
		
		this.emitQueueInfo(queue_id, "end");

		for(let i = 0; i < items.length; i++){
			if(!items[i].downloaded){
				this.emitInfo(items[i].id, "end");
			}
		}

		return;
	}

	static getFileOrFolder(file_path, get_file) {

		let slash_type = "";

		if(file_path.includes("//")) {
			slash_type = "//";

		} else {
			slash_type = "\\";
		}

		let file_path_array = file_path.split(slash_type);
		
		let last_array_index = file_path_array.length - 1;

		if(get_file) {
			return file_path_array[last_array_index];

		} else {
			file_path_array.splice(last_array_index, 1);
			return file_path_array.join(slash_type);
		}

	}

}

module.exports = Utils;