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
		return new Promise((resolve, reject) => {
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

		for(let i = 0; i < items.length; i++) {
			delete items[i].url;
			delete items[i].duration;
			delete items[i].author;
		}

		return items;
	}

	static getDtFormated(date, date_options) {

		const { index, separator, add_zero } = date_options;
		const date_string = date.toLocaleDateString("en-US");
		const date_array = date_string.split("/");
		let date_formated = "";
		
		const add_zero_to_number = (number) => {
			
			if(add_zero){
				number = number + "";

				if(number.length === 1) {
					number = "0" + number;
				}
			}

			return number;
		}

		for (let i = 0; i < index.length; i++) {
			switch(index[i]) {
				case "YYYY":
					date_formated += separator + date_array[2];
					break;

				case "MM":
					date_formated += separator + add_zero_to_number(date_array[0]);
					break;

				case "DD":
					date_formated += separator + add_zero_to_number(date_array[1]);
					break;
			}
		}
      
		date_formated = date_formated.substr(1, date_formated.length - 1);

		return date_formated
	}

	static async getVideoDt(info, date_options) {
		return new Promise(async (resolve, reject) => {

			if(isNaN(info.published)) {
				reject(new Error(constants.errors.GET_DT));

			} else {
				const dt = new Date(info.published);
				const date_formated = this.getDtFormated(dt, date_options);
				resolve(date_formated);
			}
			
		})
	}

	static async infoPlaylist(url) {
		return new Promise((resolve, reject) => {
			ytpl(url, { limit: 0 }, async (err, playlist) => {
				if(err) {
					reject(err);
				} else {
					playlist.queue_id = this.getRandId();
					playlist.items = await this.getItemsIdsAndDlFields(playlist.items);
					playlist.items = this.getPlaylistItemsClean(playlist.items);
					resolve(playlist);
				}
			});
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

					video.title = info.title;
					video.url_simple = urls[i];
					video.thumbnail = this.subStringWhenCharAppears(
						"?",
						info.player_response.videoDetails.thumbnail.thumbnails[0].url
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

}

module.exports = Utils;