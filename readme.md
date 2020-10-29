
# Dl From YT

Dl From YT (or DFY) is an npm package that allows you to download videos, playlists, and channels from YT.

Note: DFY cannot download livestreams, or recorded livestreams.

# Consider this when reading the docs

Whenever you see any code example that's using the JavaScript "await", consider that example to be running inside an async function.

And when you see any "dfy" being used in any code example, assume what the example below will show, is where this "dfy" originated from.

```javascript
const dfy = require("dl-from-yt")
```

# Requirements

- Node
- FFmpeg accessible via your system cmd/terminal* (libx264 must be enabled on your FFmpeg if you want to use the ["convert_to_mp4"](#convert-to-mp4) option)

Here are some tutorials:

- [How to install FFmpeg on Ubuntu 16](https://stackoverflow.com/questions/52756925/ffmpeg-libx264-on-ubuntu-16)
- [How to install FFmpeg on Windows 10](https://www.wikihow.com/Install-FFmpeg-on-Windows)**
- [How to install FFmpeg on OS X](https://superuser.com/questions/624561/install-ffmpeg-on-os-x)

*Except when downloading videos as audio only with the ["convert_to_mp3"](#convert-to-mp3) option equal to false, or, when downloading videos as video only with the ["convert_to_mp4"](#convert-to-mp4) option equal to false. Also, this requirement can be circunvented by using the "FFmpeg path" parameter, more info on that [here](#the-same-parameters-across-the-two-functions).

**It requires [WinRar](https://www.win-rar.com)

# How it works?

Whenever you are watching a video on YT, two separate files will be downloaded, one containing the audio, and the other one containing the video, the YT player will "sync" those files and then play the video.

So, when using DFY to download any video, it will download both of those files, and then they will be merged together using FFmpeg.

Or, if want to, it is possible download only the video or only the audio.

## How is the best video format chosen?

When downloading a video from YT, there will probably be various video qualities to choose from (144p, 240p, 360p, etc), and using DFY you will be able to choose any video quality you want to, see [Video quality](#video-quality) for more info on that.

But, lets assume you have chosen to download your video at 720p.

The first scenario is that the video is available on 720p, but, there are 2 video files available for the 720p quality, one is a .webm, the other one is a .mp4, so, which one will be downloaded? The lightest (but you can change it [here](#biggest-video)).

The second scenario is that the video is not available in 720p, only on 480p and below. Then, the video will be downloaded at 480p (the best quality available), and if there are 2 or more files at the 480p quality, the lightest will be downloaded (but you can change it [here](#biggest-video)).

The third scenario is that the video is only available on 1080p and above. The video will be downloaded at the closest best quality, which is 1080p, and again, if 2 1080p or more files are available, the lightest will be downloaded (but you can change it [here](#biggest-video)).

## How is the best audio format chosen?

DFY will always choose the one with highest bitrate (kbps), and if 2 or more files have the same bitrate, the lightest will be downloaded (but you can change it [here](#biggest-audio)).

## Downloading audio and video

First the video will be downloaded, and then the audio.

If the audio and video are from the same containers (example, the video is webm and the audio is webm, or, the video is mp4 and the audio is m4a) they will be merged together, but, if the containers are different they will still be merged, but, as a .mkv instead.

Not all the videos will be available to be merged as mp4 by default, but you can convert the .webm files to .mp4 too, see [Convert to mp4](#convert-to-mp4) for more info on that.

## Downloading only the audio or only the video

If you want to download the video as audio only, or as video only, both are possible.

When downloading as audio only, the possible resulting files are a .webm or a m4a, and when downloading as video only it can be a .webm or a .mp4.

But, if you want to, you can convert the video for it to always be an mp4, or you can convert the audio for it to always be an mp3 (and even add the video thumbnail as a "album" cover), see [Options](#options) for more info on that.

## Filenames

Whenever your files are saved, or a folder is created (in case you choose not to use a custom folder), your files and folder names will suffer some alterations. There are 2 cases in which this can happen:

### 1st - When a playlist or video title have invalid characters in it

When DFY creates the folder for a playlist (when no custom folder is set), or, when it is going to create the video filename, all the invalid characters will be removed.

This was implemented because some operating systems don't allow certain characters on the file or folder name.

These are the characters considered invalid:

- / (forward slash)
- \ (backslash)
- ? (question mark)
- % (percent sign)
- \* (asterisk)
- : (colon)
- | (pipe)
- " (double quote)
- < (less than)
- \> (greater than)
- . (dot)

Lets use these 4 video titles as an example:

- Nichya - Nichya ( НИЧЬЯ /НИЧЬЯ )
- GROSU. Трилогия "Дико Любила Вову"
- GROSU - Н.А.Р.К.О.Т.И.К.И.
- *.%?

Now, lets remove all the invalid characters:

- Nichya - Nichya ( НИЧЬЯ НИЧЬЯ )
- GROSU Трилогия Дико Любила Вову
- GROSU - НАРКОТИКИ
- \-

If the removal of all the invalid characters result in a empty string (like the 4th title), it will become a "-" (dash) instead.

### 2nd - When a playlist or video title is equal to a reserved system filename (Windows Only)

The list containing all the reserved filenames can be seen [here](https://kizu514.com/blog/forbidden-file-names-on-windows-10/).

If DFY sees that you are running it on a windows machine, this will automatically be "activated".

This was necessary, because in any windows PC, some file/folder names are reserved for the system (Example: nul, aux, com1), so if any video or playlist title is equal to any of those characters, a "-" (dash) will be added at the end of the filename.

So, lets use these 3 video titles as an example:

- AuX
- cOM1
- prn

Now, lets see the resulting titles:

- AuX-
- cOM1-
- prn-

And as you can see, it is case insensitive too.

### Working with custom folders

If you are working with custom folders, DFY will not be able to clean the folder name automatically, but in this case DFY made available the same function that "cleans" the video and playlist titles, and it's called "getStrClean".

Lets see an example:

```javascript
const url = "https://www.yt-url.com/playlist?list=PLZlIzKeS1ckgbF-rkoAN3AdX0Gg-_DjbQ";

const playlist = await dfy.getPlaylistVideos(url);

const my_custom_path = "./a/nice/path/" + dfy.getStrClean(playlist.title);
```

## Where the videos will be saved

If you haven't set a [custom download folder](#custom-download-folder), then DFY will be using its default download pathing scheme.

This is the path tree that will be created under your downloads folder.

```
Downloads (the downloads folder under your os homedir)
	|---DlFromYT (this, and all the subfolders inside will be created by DFY)
		|---playlists
			|---audio and video
			|---audio only
			|---video only
		|---videos
			|---audio and video
			|---audio only
			|---video only
```

Lets say you've decided to download some videos as video only, so, your videos will be saved under "/DlFromYT/videos/video only/", and if you where to save them as audio only it would be saved on the same path but under the "audio only" folder, and so on.

Now, lets say you've decided to download a playlist called "funny videos" as audio and video, so, your playlist videos will be saved under "/DlFromYT/playlists/audio and video/funny videos/", and if you where to save them as video only it would be saved on the same path but under the "video only" folder, and so on.

## Queue

Basically when downloading your videos/playlist/channel a queue will be created, in which you be able to set [how many videos will be downloaded at the same time](#max-downloading), but, a new individual queue will be created for each function call, here is an example with the "max_downloading" equal to 10.

Example:

```javascript
const url1 = "https://www.yt-url.com/playlist?list=PLpXA1IqBgeZRRJRC9GKUPkZSIk4hLb3DZ";
const url2 = "https://www.yt-url.com/playlist?list=PLZlIzKeS1ckgbF-rkoAN3AdX0Gg-_DjbQ";

//here 10 videos will be downloaded at the same time
dfy.playlist(VIDEO_ONLY, null, url1)
.then(() => {
  console.log("downloaded")
})

//here another 10 videos will downloaded at the same time
dfy.playlist(AUDIO_ONLY, null, url2)
.then(() => {
  console.log("downloaded")
})

//as queues are individual for each function call
//in the end you will be dowloading 20 videos at the same time
```

# Usage

## Options

DFY makes it possible for you to define some options when downloading videos/playlist/channel, so lets explain each parameter, and how to set and get them, and, how to set them to default (in case you've messed).

Down below you can see the default options json.

```javascript
{
  video_quality: "4320p60",
  convert_to_mp3: false,
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
```

### Working with the options

#### How to get the options

To get the options that are already saved, you need to use the DFY method "getOptions", see the example below.

```javascript
const options_json = await dfy.getOptions();
```

#### How to set the options

To set the options you need to use the DFY method "setOptions", see the example below.

```javascript
let options_json = await dfy.getOptions();

//change any options you want to
options_json.convert_to_mp3 = true;

//and then save it
await dfy.setOptions(options_json)
```

#### How to set the options to default

To set the options to default you need to use the DFY method "setDefaultOptions", it will be saved exactly as the json shown [here](#options), see the example below.

```javascript
await dfy.setDefaultOptions();
```

#### How to get the default options

To get the default options you need to access the DFY property "default_options", it will be exactly as the json shown [here](#options).

```javascript
let options = dfy.default_options;

//maybe you want to set new options, but already using
//some of the default ones
options.index_separator = "_";
options.max_downloading = 20;
options.max_retries = 2;

//save it
await dfy.setOptions(options)
```

### Parameters

#### Video quality

The "video_quality" parameter is of type string, and can be chosen by using the DFY property "available_formats" to find the specific format you want inside of its array of json objects.

If you always want the best quality out of any video, you can just choose the last element in the "available_formats" array, or, if you would like to always get the worst, just chose the first element of it.

You can choose any video quality you want, but they will follow the rules explained [here](#how-is-the-best-video-format-chosen).

See the example below.

```javascript
//lets get the available formats
const af = dfy.available_formats;

//so lets say that I would like to save the videos
//at 144p, which is the first format
const format = af[0];

//the "title" attr. is just the format title
console.log("I'm choosing the ", format.title, " video quality")

//lets grab the options
let options_json = await dfy.getOptions();

//the "value" attr. is actually what
//will be set to the "video_quality"
//parameter
//so lets change it
options_json.video_quality = format.value;

//save it
await dfy.setOptions(options_json);
```

```javascript
//dfy.available_formats when console logged
[
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
]
```                                                                                           

#### Convert to mp3

The "convert_to_mp3" parameter is of type boolean, so, if set to true, when downloading videos as audio only all the files will be converted to mp3 (with the correct bitrate).

#### Add video thumbnail to mp3

If "convert_to_mp3" is set to true, then, the "add_video_thumbnail_to_mp3" parameter, that is of type boolean, will be able to take effect, so, if set to true, when downloading videos as audio only all the mp3 files will also get the video thumbnail added as a cover.

#### Convert to mp4

The "convert_to_mp4" parameter is of type boolean, so, if set to true, when downloading videos as audio and video or video only, all the files will be converted to mp4.

#### Index separator

The "index_separator" parameter is of type string and can be null.

If it is not null, then DFY will understand that you want to add the video index at the beginning of the filename.

Please use it with caution, because if you change the position of any of your playlist videos, then add new ones, and download your playlist again, the new videos will have the same position/index number of the video that where on that old position/index. It also works with multiple/single video download, but again, please use it with caution, as an example, if various multiple video downloads where made without changing the index separator character, the beginning of various filenames would be the same (ex: 10 videos with '1_' at the start of their filename).

Example:

```javascript
let options_json = await dfy.getOptions();

//setting a new index separator
options_json.index_separator = " - ";

//save it
await dfy.setOptions(options_json)
```

Resulting filenames on a playlist with 3 videos:

- 1 - Hande Yener - Kibir (Yanmam Lazım)
- 2 - Hande Yener - Kim Bilebilir Aşkı
- 3 - Ayse Hatun Önal - Sirenler

#### Date options

The "date_options" parameter is a json object, following the same format as in the [default options](#options), and can be of type null.

If it is not null, then DFY will understand that you want to add the video upload date at the end of the filename.

Example:

```javascript
let options_json = await dfy.getOptions();

//creating the new date options
const new_date_options = {
  add_zero : true,
  index: [
    "DD",
    "MM",
    "YYYY"
  ],
  separator: "_",
  title_separator: " - "
};

//setting the new date options
options_json.date_options = new_date_options;

//save it
await dfy.setOptions(options_json)
```

Resulting filenames on a playlist with 3 videos:

- Kemal Doğulu - Hande Yener - Bir Yerde - 1 - 04_03_2014
- SEREBRO – ПЕРЕПУТАЛА - 18_06_2015
- Ayse Hatun Önal - Kalbe Ben - 03_10_2009

##### Add zero

The "add_zero" parameter is of type boolean, so, if set to true, when setting the date it will add zeroes to the month and day, in case they are smaller than 10.

Example 1: The date 7-2-1993 will become 07-02-1993.

Example 2: The date 17-5-2008 will become 17-05-2008.

##### Index

The "index" parameter is an array containing the base layout of the date.

The accepted options for the array are, the year ( as "YYYY"), the month (as "MM") and the day (as "DD").

Lets use the date 15-8-2012 as an example, but using "-" as separator and "add_zero" as true.

```javascript
//this is the index before using it on the date option
let index = [];

//with the index as follows the date at the filename will be
//2012-08-15
index = [
  "YYYY",
  "MM",
  "DD"
];

//with the index as follows the date at the filename will be
//2012-15-08
index = [
  "YYYY",
  "DD",
  "MM"
];

//with the index as follows the date at the filename will be
//08-2012
index = [
  "MM",
  "YYYY"
];

//with the index as follows the date at the filename will be
//15-15-15-2012-08-08
index = [
  "DD",
  "DD",
  "DD".
  "YYYY",
  "MM",
  "MM"
];
```

##### Separator

The "separator" parameter is of type string.

Basically it is the string that will separate the date "components".

Example: with a "index" equal to ["YYYY", "MM", "DD"] and a "separator" equal to "_", the resulting date will be in the format "YYYY_MM_DD".

##### Title separator

The "title_separator" parameter is of type string.

Basically it is the string that will separate the date from the title itself.

Example: with a "title_separator" equal to "-", and a video with the title "Sanduíche iche", the resulting filename would be "Sanduíche iche-YYYY_MM_DD".

#### Retry

The "retry" parameter is of type boolean, so, if set to true, when downloading videos and a known error occur (when you have the "date_options" set, but the date wasn't able to be fetched, or, when the video info wasn't available to be fetched), DFY will retry the download of the affected ones, but only after all the other "good" ones where "downloaded"/"processed" by the [queue](#queue).

#### Max retries

If "retry" is set to true, then the "max_retries" parameter, that is of type integer, will be able to take effect.

With it you can set the maximum numbers of retries.

#### Retry wait time

If "retry" is set to true, then the "retry_wait_time" parameter, that is of type integer, will be able to take effect.

With it you can set the wait time (in milliseconds) before a retry happen.

#### Check if file exists

The "check_if_file_exists" parameter is of type boolean, so, if set to true, when downloading videos/playlist/channel, it will check if the videos are already present in the download folder, and if so, the already downloaded videos will not be downloaded again.

But, if set to false, all the videos will be re-downloaded and their files (if present) will be overwritten too.

#### Max downloading

The "max_downloading" parameter is of type integer, and represents the maximum videos to be downloaded by each [queue](#queue).

#### Biggest video

The "biggest_video" parameter is of type boolean, and represents if the video file to be downloaded will be the lightest (in case it is false) or the heaviest (in case it is true).

#### Biggest audio

The "biggest_audio" parameter is of type boolean, and represents if the audio file to be downloaded will be the lightest (in case it is false) or the heaviest (in case it is true).

#### Log already downloaded

The "log_already_downloaded" parameter is of type boolean, and represents if it will console log the title of the videos that you already downloaded.

#### Best mp3 thumbnails

If "convert_to_mp3" and "add_video_thumbnail_to_mp3" are set to true, then, the "best_mp3_thumbnails" parameter, that is of type boolean, will be able to take effect, so, if set to true, when downloading videos as audio only all the mp3 files will also get the best quality thumbnail added as a cover.

## Downloading

DFY makes it possible to download videos by using the "videos" function, and, to download channels and playlists by using the "playlist" function.

Those two functions have the same arguments, but there is a small difference in regards to the 2nd ("videos_info" or "playlist_videos_info") and 3rd ("urls" or "url") parameters (more about that later), but for now lets see how the other ones work.

### The same parameters across the two functions

#### Type (1st parameter - mandatory)

The "type" parameter is of type string, and represent the download type, which can be [only the audio or only the video](#downloading-only-the-audio-or-only-the-video), or, [audio and video](#downloading-audio-and-video).

The available types can be accessed via the DFY json property "types".

Example:

```javascript
const types = dfy.types;

//this is the type used to download videos as video only
types.VIDEO_ONLY;

//this is the type used to download videos as audio only
types.AUDIO_ONLY;

//this is the type used to download videos as audio and video
types.AUDIO_AND_VIDEO;

//so lets download a playlist as video only
const url = "https://www.yt-url.com/playlist?list=PLk4iMx0kM9My9EaM-7QAnAqna6itFBzfm";
await dfy.playlist(types.VIDEO_ONLY, null, url); //the other params are optional
```

#### Custom download folder (4th parameter - optional)

The "custom_dl_folder" parameter is of type string and can be null, it represents the custom path to which your videos/playlist/channel will be downloaded.

And a cool thing that happens when you are using custom folders, is that, if some of the folders on your path don't exist, DFY will then recursively create them.

So, lets say you've specified the custom path "/home/user/my/videos/", but, the "my" folder doesn't exist, so, DFY will create both "my" and inside of it "videos" for you.

If you end up working with custom folders, maybe [this](#working-with-custom-folders) tip would be of some use.

Example:

```javascript
const my_custom_path = "./some/cool/path/";

const url = "https://www.yt-url.com/watch?v=sprukwRl9ZQ";

await dfy.videos(dfy.types.AUDIO_ONLY, null, [url], my_custom_path);
```

#### Custom options (5th parameter - optional)

The "custom_options" parameter is a json object, and can be null, it represents the custom options json to which your videos/playlist/channel will be downloaded.

When you don't use any custom options, the saved ones will be used instead.

This was implemented because maybe you would like to download some videos but without using the saved options, and instead of going through the hassle of saving the options again, you could just pass in a json containing your custom options.

Example:

```javascript
//lets use the default, instead of the saved one
const custom_options = dfy.default_options;

const url = "https://www.yt-url.com/watch?v=slnugihiJtE";

await dfy.videos(dfy.types.AUDIO_AND_VIDEO, null, [url], null, custom_options);
```

#### FFmpeg path (6th parameter - optional - EXPERIMENTAL)

The "ffmpeg_path" parameter is of type string, and can be null, it represents the path to a ffmpeg binary, in case you don't have it accessible via or system cmd/terminal.

Example:

```javascript
const path = "my/path/to/a/ffmpeg/binary";

const url = "https://www.yt-url.com/watch?v=slnugihiJtE";

await dfy.videos(dfy.types.AUDIO_AND_VIDEO, null, [url], null, null, path);
```

### Downloading videos

To download videos you need to use the DFY function "videos".

You can either pass an array containing all the videos urls, or, pass a json already containing all the videos info to it. Lets see the two approaches.

#### Using only the urls

This method is by far the easiest, lets see an example:

```javascript
//here you have the array containing your videos urls
const urls = [
  "https://www.yt-url.com/watch?v=Bw3uBSfQJbI",
  "https://www.yt-url.com/watch?v=LCDaw0QmQQc"
];

//just pass it as the 3rd parameter, and you are done
await dfy.videos(dfy.types.AUDIO_ONLY, null, urls);
```

#### Using a json

To get the json containing all your videos info you need to use the DFY function "getVideosInfo" passing an array with the videos urls to it, more info on when or why to use this function [here](#when-or-why-to-download-using-a-json).

Example:

```javascript
const urls = [
  "https://www.yt-url.com/watch?v=EHMm_ElRvMA",
  "https://www.yt-url.com/watch?v=Zc6PL_f79x4",
  "https://www.yt-url.com/watch?v=gAanXAKqISE"
];

const videos_info = await dfy.getVideosInfo(urls);

//now just pass the "videos_info" as the 2nd 
//parameter and you are done
await dfy.videos(dfy.types.AUDIO_AND_VIDEO, videos_info);
```

### Downloading playlists and channels

To download a playlist or a channel you need to use the DFY function "playlist".

You can either pass the playlist/channel url, or, pass a json already containing all the playlist/channel videos info to it. Lets see the two approaches.

#### Using only the url

This method is by far the easiest, lets see an example:

```javascript
const url = "https://www.yt-url.com/channel/UCwTYMmNi1Jm1WQje6FQCwpg";

//just pass it as the 3rd parameter, and you are done
await dfy.playlist(dfy.types.VIDEO_ONLY, null, url);
```

#### Using a json

To get the json containing all your playlist/channel videos info you need to use the DFY function "getPlaylistVideosInfo" passing the playlist/channel url to it, more info on when or why to use this function [here](#when-or-why-to-download-using-a-json).

Example:

```javascript
const url = "https://www.yt-url.com/user/BrunoEMarrone";

const videos_info = await dfy.getPlaylistVideosInfo(url);

//now just pass the "videos_info" as the 2nd 
//parameter and you are done
await dfy.videos(dfy.types.AUDIO_ONLY, videos_info);
```

### When or why to download using a json

#### To get some info about the videos you are about o download

When you use any of those functions to get the json containing the info on your playlist/channel, or videos, you are able to see some content about them too, like the video title, its thumbnail url, and more.

Lets see what "getVideosInfo" returns:

```javascript
{
  //this 'queue_id' here is generated by DFY, more on that later
  queue_id: '1590251884154581064',
  
  //inside the 'items' array is where the info from all
  //your videos will be
  items: [
    {
      title: "蕭亞軒 Elva Hsiao - 愛的主打歌 Theme Song Of Love (官方完整版MV)",
      url_simple: 'https://www.yt-url.com/watch?v=EHMm_ElRvMA',
      thumbnail: 'https://i.ytimg.com/vi/EHMm_ElRvMA/hqdefault.jpg',
      //this 'id' here is generated by DFY, more on that later
      id: '1590251886357277680',
      downloaded: false
    }
  ]
}
```

Lets see what "getPlaylistVideosInfo" returns:

```javascript
{
  //here is some info available about the playlist
  id: 'UUwTYMmNi1Jm1WQje6FQCwpg',
  url: 'https://www.yt-url.com/playlist?list=UUwTYMmNi1Jm1WQje6FQCwpg',
  title: 'Uploads from Ayşe Hatun Önal',
  visibility: 'everyone',
  description: null,
  total_items: 1,
  views: 174,
  last_updated: 'Last updated on Nov 12, 2018',
  author: {
    id: 'UCwTYMmNi1Jm1WQje6FQCwpg',
    name: 'Ayşe Hatun Önal',
    avatar: 'https://yt3.ggpht.com/a/AATXAJz84c9Wb9F8RWR7fJ89cuGYhe5Z7gqjZrdgFA=s100-c-k-c0xffffffff-no-rj-mo',
    user: null,
    channel_url: 'https://www.yt-url.com/channel/UCwTYMmNi1Jm1WQje6FQCwpg',
    user_url: null
  },
  //inside the 'items' array is where the info from all
  //your videos will be
  items: [
    {
      //this 'id' here is generated by DFY, more on that later
      id: '1590174181099421839',
      url_simple: 'https://www.yt-url.com/watch?v=8Fn2MvFp2bg',
      title: 'Ayşe Hatun Önal - Selam Dengesiz',
      thumbnail: 'https://i.ytimg.com/vi/8Fn2MvFp2bg/hqdefault.jpg',
      downloaded: false
    }
  ],
  //this 'queue_id' here is generated by DFY, more on that later
  queue_id: '1590174181096499436'
}
```

#### To track progress of your queue

As explained [here](#queue) DFY uses queues to download videos, but did you know that you can keep track of how many video where download, how much are remaining in the queue to be downloaded, and more?

To get the info on your queue you need to use DFY property "listener".

The "listener" works as an emitter when listening to events, because it actually is an emitter.

But instead going through the hassle of a normal emitter, in which you need to remove the listeners manually, this will automatically be done by DFY after the [End](#end) event is emitted.

Example:

```javascript
const videos_info = await dfy.getPlaylistVideosInfo(
  "https://www.yt-url.com/playlist?list=PL19B3DAC334D5DAD5"
);

//to listen to any queue info you need to pass to "on"'s
//first param '"queue_info_" + queue_id'
dfy.listener.on("queue_info_" + videos_info.queue_id, info => {

  //when a info is received, it will
  //always return a json      
  
  //every 'info' will have a 'type'
  console.log(info.type);
  
  //every info will have a 'data'
  console.log(info.data);

})

await  dfy.playlist(types.AUDIO_AND_VIDEO, videos_info);
```

Here are all the possibilities for 'type' that a queue 'info' can have:

##### Start

It will be equal to "start", and will be emitted only once when the queue starts.

The data it returns is null.

##### Folder path

It will be equal to "folder_path", and will only be emitted when you are not using custom folders.

The data it returns is a string containing the folder to which your videos/playlist/channel will be downloaded.

##### Download Info

It will be equal to "dl", and will be emitted occasionally.

The data it returns is a json as follows:

```javascript 
{
  //the total of videos that where already downloaded
  downloaded: 8,
  //the total of videos that still need to be downloaded
  remaining: 2,
  //the total of videos being downloaded in the queue
  being_downloaded: 1,
  //the total of videos that the queue has downloaded
  total: 10
}
```

##### Status

It will be equal to "status", and will be emitted close to the queue's end or restart.

The data it returns is a string containing the download status.

##### Error

It will be equal to "err", and will be emitted close to the queue's end or restart, if, for some reason an error occurred during the download of some video(s).

The data it returns is an array of strings containing the errors that occurred.

##### Restart

It will be equal to "restart", and will be emitted when the queue's download is being restarted (will only happen if [this](#retry) option is set).

The data it returns is null.

##### End

It  will be equal to "end", and will be emitted only once when the queue has finally ended. 

The data it returns is null.

#### To track progress of your videos

As with queues, you can also keep track of your videos, for things like, when their download start, when it ends, and more.

To get the info on your videos you need to use DFY property "listener", which by the way is the same used to get the queue info.

Example:

```javascript
const videos_info = await dfy.getVideosInfo(
  [
    "https://www.yt-url.com/watch?v=8C0e9YO5dxM",
    "https://www.yt-url.com/watch?v=uv8T4rxhGJU",
	 "https://www.yt-url.com/watch?v=mSyutsZ7GuA",
	 "https://www.yt-url.com/watch?v=3Id-q7ATM40"
  ]
);

//for you to be able to get the info from all your videos
//you need to use a 'for' loop (or a 'map') to go
//through all your 'items' and then add a 
//listener to every one
videos_info.items.map(video => {

  //to listen to any video info you need to pass to "on"'s
  //first param '"info_" + video_id'
  dfy.listener.on("info_" + video.id, info => {

      //when a info is received, it will
      //always return a json
        
      //every info will have a 'type'
      console.log(info.type);
   
      //every info will have a 'data'
      console.log(info.data);
  })
})

await  dfy.videos(types.AUDIO_AND_VIDEO, videos);
```

Here are all the possibilities for 'type' that a video 'info' can have:

##### Start

It  will be equal to "start", and will be emitted only once when the video starts to be processed by the queue. 

The data it returns is null.

##### Download start

It  will be equal to "dl_start", and will be emitted when the video download starts.

The data it returns is null.

##### Download end

It  will be equal to "dl_end", and will be emitted when the video download ends.

The data it returns is null.

##### Download Info

It will be equal to "dl", and will be emitted when your video is being downloaded.

The data it returns is the same json that the node-downloader-helper [progress](https://www.npmjs.com/package/node-downloader-helper#events) event returns (but without the name field). If you're downloading your video as audio and video, then, an additional property will be available, the "total_progress", which is the total download percentage of the audio and video combined (video_dl_progress + audio_dl_progress / 2).

##### Status

It will be equal to "status", and will be emitted occasionally.

The data it returns is a string containing the video status (downloading, merging, etc).

##### Error

It will be equal to "err", and will be emitted when a error occur.

The data it returns is a string containing the error that occurred.

##### End

It  will be equal to "end", and will be emitted only once, when the video has finally been processed by the queue. 

If the video was downloaded successfully, then, the data it returns will be a string that contains the path to where the video was downloaded (Example: "path/to/my/vid.mp4"). But, if an error occurred, the data will be null.

## Parallel downloads

With DFY it is possible to run multiple download functions ("videos" and "playlist") at the same time.

This is possible because DFY creates a temp folder separate for each function call, and when the function is about to end, DFY deletes the temp folder that it has created.

So, lets say you where running multiple download functions at the same time, but for some reason your PC crashes, well, when you turn it on again, because the old temp files wouldn't be of any use no more, DFY main temp folder (which holds all the other temp folders created) would end up full of junk.

In this case, or if you just want to, you can clean the DFY main temp folder using the "cleanTemp" method.

Example:

```javascript
//BEWARE: dont't run this while downloading
//any videos/channels/playlists
await dfy.cleanTemp();
```

# License

MIT