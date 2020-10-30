const fs = require("fs");
const os = require('os');
const path = require("path");
const constants = require("./constants");

class FsHandler {

	//check if folder or file exists
	static async pathExists(path){
		return new Promise((resolve, reject) => {
			fs.access(path, fs.constants.F_OK, err => {
            if(err){
					resolve(false);
            } else {
               resolve(true);
            }
          });
		})
	}

   static async createFolder(folder_path){
      return new Promise((resolve, reject) => {
			fs.mkdir(folder_path, { recursive: true }, err => {
				if (err){
					reject(err);
				} else {
					resolve();
				}
			});
      })
   }
 
   static async deleteFile(file_path){
      return new Promise((resolve, reject) => {
			fs.unlink(file_path, err => {
				if(err){
					reject(err);
				} else {
					resolve();
				}
			});
      })
   }

   static async fileExists(folder_path, file_name){
      return new Promise((resolve, reject) => {
         
         let exists = false;

         fs.readdir(folder_path, (err, files) => {
            if(err){
               resolve(exists);
            } else {
					
               for(let i = 0; i < files.length; i++){ 
                  if(files[i].toLowerCase().includes(file_name.toLowerCase())){
                     exists = true;
							break;
						}
               }

               resolve(exists);
            }
         })
      })
	}
	
	static async deleteFolder(folder_path){
		return new Promise((resolve, reject) => {
			fs.rmdir(folder_path, err => {
				if(err){
					reject(err);
				} else {
					resolve();
				}
			})
		})
	}

   static async deleteFilesFromFolder(folder_path){
      return new Promise(async (resolve, reject) => {
         let files = [];

         let index = 0;

         const del = async () => {

            if(index == files.length){
               resolve();

            } else {

               try{
                  await this.deleteFile(this.getPath(folder_path, files[index]));
                  index += 1;
                  del();

               } catch(err){
                  reject(err)
               }

            }
         }

         fs.readdir(folder_path, (err, files_from_folder) => {
            if(err) {
               reject(err)
            } else {
               files = files_from_folder;
               del();
            }
         })
      })
   }

   static async moveFile(from, to){
      return new Promise(async (resolve, reject) => {
			
			const move = () => {
				const source_file = fs.createReadStream(from);
				const dest_file = fs.createWriteStream(to);

				source_file
				.pipe(dest_file)
				.on('finish', async () => {
					try{
						await this.deleteFile(from)
						resolve();
					} catch(err) {
						reject(err);
					}
				})
				.on('error', async (err) =>{
					source_file.close();
					dest_file.close();

					try{
						await this.deleteFile(to)
						reject(err);

					} catch(err) {
						reject(err);
					}
				});
			}
			
			if(await this.pathExists(to)){
				try {
					await this.deleteFile(to);
					move();
				} catch(err) {
					reject(err)
				}
			} else {
				move();
			}
			
      })
   }

   static async cleanTemp(){
      return new Promise(async (resolve, reject) => {
         try{
				const temp_path = this.getPathWithDirn("..", "temp");

				await this.createFolder(temp_path);
				
				fs.readdir(temp_path, (err, folders) => {
					if(err) {
						reject(err);

					} else {
						folders.map(async (folder_path) => {
							await this.deleteFolderAndFilesInside(
								this.getPath(temp_path, folder_path))
						})

						resolve();
					}
				})

         } catch(err) {
            reject(err);
         }
      })
	}
	
	static async getTempPath(){
		return new Promise(async (resolve, reject) => {

			const getRandId = () => {
				return new Date().getTime() + "" + Math.round(Math.random() * 1000000);
			}

			const base_temp_path = this.getPathWithDirn("..", "temp");
			let queue_temp_path = "";
			let created = false;

			while(!created){
				const folder_name = getRandId();

				queue_temp_path = this.getPath(base_temp_path, folder_name);

				if(!(await this.pathExists(queue_temp_path))){
					try {
						await this.createFolder(queue_temp_path);
						created = true;
						resolve(queue_temp_path);
						
					} catch(err) {
						reject(err);
					}
				}
			}
		})
	}

	static async deleteFolderAndFilesInside(folder_path){
		return new Promise(async (resolve, reject) => {
			try {
				await this.deleteFilesFromFolder(folder_path);
				await this.deleteFolder(folder_path);
				resolve();

			} catch(err) {
				reject(err)
			}
		})
	}

   static async createFolderStructure(){
      return new Promise(async (resolve, reject) => {
         
         try{
            const types = constants.types;

            for(let key in types){
               await this.createFolder(this.getPathWithDFP("videos", types[key]));
               await this.createFolder(this.getPathWithDFP("playlists", types[key]));
            }

            resolve();

         } catch(err) {
            reject(err);
         }
      })
   }

   static getPath(){
      return path.join.apply(null, arguments)
   }

   static getDlFolderPath(){
      return path.join(os.homedir(), "Downloads", "DlFromYT")
   }

   //DlFolderPath equals DFP
   static getPathWithDFP(){

      let args = [];

      args.push(this.getDlFolderPath());

      for(let i = 0; i < arguments.length; i++){
         args.push(arguments[i]);
      }

      return this.getPath.apply(null, args)
   }

   //Dirname equals Dirn
   static getPathWithDirn(){

      let args = [];

      args.push(__dirname);

      for(let i = 0; i < arguments.length; i++){
         args.push(arguments[i]);
      }

      return this.getPath.apply(null, args)
   }
	
	static async getOptions() {
		return new Promise((resolve, reject) => {
			const read_options_stream = fs.createReadStream(constants.OPTIONS_PATH);

			let json_string = "";

			read_options_stream
			.on("data", buffer => {
				json_string += buffer
			})
			.on("error", err => {
				reject(err)
			})
			.on("end", () => {
				resolve(JSON.parse(json_string))
			})
		})
	}

	static async setOptions(options_json) {
		return new Promise((resolve, reject) => {
			const write_options_stream = fs.createWriteStream(constants.OPTIONS_PATH)

			write_options_stream.write(JSON.stringify(options_json, null, "  "), "utf8");

			write_options_stream
			.on("error", err => {
				reject(err)
			})
			.on("finish", () => {
				resolve()
			})
		})
	}

	static async setDefaultOptions() {
		return new Promise(async (resolve, reject) => {
			try {
				await this.setOptions(constants.DEFAULT_OPTIONS_JSON)
				resolve();
			} catch(err) {
				reject(err)
			}
		})
	}
}

module.exports = FsHandler;