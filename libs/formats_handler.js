const Utils = require("./utils");

class FormatsHandler {

	static getVideoFormat(formats, video_quality, biggest_video) {

		const get_format_score = (value_or_qualityLabel) => {
					
			let quality = parseInt(
				Utils.subStringWhenCharAppears("p", value_or_qualityLabel)
			);

			if(value_or_qualityLabel.includes("15")){
				quality -= 1;
			}

			if(value_or_qualityLabel.includes("p60")){
				quality += 3;
			}

			if(value_or_qualityLabel.includes("p50")){
				quality += 1;
			}

			if(value_or_qualityLabel.includes("HDR")){
				quality += 1;
			}
				
			return quality;
		}

		let best_video_size = 0;
		let best_chosen_video_size = 0;
		let best_diff_video_size = 0;
		let best_video_index = -1;
		let found_best = false;
		let found_closest = false;
		let best_diff = 0;
		const video_quality_score = get_format_score(video_quality);

		for (let i = 0; i < formats.length; i++) {
			if(formats[i].qualityLabel) {

				const format_score = get_format_score(formats[i].qualityLabel);
				const size = parseInt(formats[i].contentLength);

				if(format_score === video_quality_score) {

					if(best_video_size === 0) {

						found_best = true;
						best_video_index = i;
						best_video_size = size;

					} else {

						if(biggest_video ? size > best_video_size : size < best_video_size) {
							best_video_index = i;
							best_video_size = size;
						}

					}

				} else {

					if(!found_best) {

						if(format_score > video_quality_score) {

							const diff = format_score - video_quality_score;

							if(best_diff === 0) {

								found_closest = true;
								best_video_index = i;
								best_diff = diff;
								best_diff_video_size = size;

							} else {

								if(diff < best_diff) {
									best_video_index = i;
									best_diff = diff;
									best_diff_video_size = size;
									
								} else {
									
									if(diff === best_diff){
										if(biggest_video ? size > best_diff_video_size : size < best_diff_video_size) {
											best_video_index = i;
											best_diff_video_size = size;
										}
									}
								}
							}

						} else {

							if(!found_closest) {

								if(best_video_index === -1) {
									best_video_index = i;
									best_chosen_video_size = size;
								
								} else {
									const best_video_score = get_format_score(formats[best_video_index].qualityLabel);

									if(format_score === best_video_score){

										if(biggest_video ? size > best_chosen_video_size : size < best_chosen_video_size){
											best_video_index = i;	
											best_chosen_video_size = size;
										}

									} else {

										if(format_score > best_video_score){
											best_video_index = i;
											best_chosen_video_size = size;
										}

									}
								}
							}
						}
					}
				}
			}
		}

		return formats[best_video_index]

	}

	static getAudioFormat(formats, biggest_audio) {
				
		let best_audio_size = 0;
		let best_audio_index = 0;
		let best_audio_bitrate = 0;

		for (let i = 0; i < formats.length; i++) {
			if(formats[i].audioQuality) {

				const size = parseInt(formats[i].contentLength);

				const set_best_audio = () => {
					best_audio_index = i;
					best_audio_size = size;
					best_audio_bitrate = formats[i].audioBitrate;
				}

				if(formats[i].audioBitrate === best_audio_bitrate){

					if(best_audio_size == 0){
						set_best_audio();

					} else {

						if(biggest_audio ? size > best_audio_size : size < best_audio_size){
							set_best_audio();
						}

					}

				} else {
					if(formats[i].audioBitrate > best_audio_bitrate){
						set_best_audio();
					}
				}
			}
		}

		return formats[best_audio_index]
	}

	static getFormats(formats, video_quality, biggest_video, biggest_audio) {
		
		const audio = this.getAudioFormat(formats, biggest_audio);
		const video = this.getVideoFormat(formats, video_quality, biggest_video);

		const formats_js = {
			audio,
			video
		}

		return formats_js;
	}
}

module.exports = FormatsHandler;