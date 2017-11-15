const debug = require('debug')('node-red:extract-keyframes');
const fs = require('fs');
const spawn = require(`child_process`).spawn;
const ffmpeg = require(`ffmpeg-static`);
const ffprobe = require(`ffprobe-static`);
const uuid = require('uuid/v4');

const WORKING_DIRECTORY = process.env.WORKING_DIRECTORY || '/tmp';

// Get Keyframes
// ffmpeg -i input.mp4 -q:v 2 -vf select="eq(pict_type\,PICT_TYPE_I)" -vsync 0 frame%03d.jpg

// Get time offsets of keyframes 
// ffprobe -loglevel error -select_streams v:0 -show_entries frame=key_frame,pkt_pts_time -of csv=print_section=0 input.mp4 | awk -F`,` `/^1,/{print $2}`

// Extracting frame at time offset
// ffmpeg -ss 01:23:45 -i input -vframes 1 -q:v 2 output.jpg

function spawnProcess(binaryPath, args){
    console.log(`\n\n`, binaryPath, args.join(` `), `\n\n`);    
    return spawn(binaryPath, args);
}

module.exports = function(RED) {
    
    function extractKeyframes(config) {
        RED.nodes.createNode(this,config);
        const node = this;

        this.on(`input`, function(msg) {

            let firstFrame = true;
            let finishedLooking = false;
            let framesIdentified = 0
            let framesGenerated = 0;

            const filePath = msg.payload.filePath;
            const jobUUID = uuid();
            const outputPath = `${WORKING_DIRECTORY}/${jobUUID}`;

            console.log(`INPUT FILEPATH:`, filePath);
            console.log(`OUTPUT FILEPATH:`, outputPath);

            fs.mkdir(outputPath, function(err){
               
                if(err){
                    console.log('DIRECTORY CREATION ERROR', err);
                    throw err;
                }
                
                // FFProbe Options / Listeners
    
                const keyframeTimeIndexExtractionArguments = [
                    `-loglevel`,
                    `error`,
                    `-select_streams`,
                    `v:0`,
                    `-show_entries`,
                    `frame=pkt_pts_time,pict_type`,
                    `-of`,
                    `csv=print_section=0`,
                    `${filePath}`
                ];

                const keyframeTimeIndexExtraction = spawnProcess( ffprobe.path, keyframeTimeIndexExtractionArguments );
                
                keyframeTimeIndexExtraction.stdout.on(`data`, (data) => {
                    data = data.toString(`utf8`);

                    // console.log(data, data[data.length - 2]);
                    // We want to look for frames labelled with 'I'. These are the keyframes
                    if(data.indexOf('I') > -1){

                        const instances = data.split('\n').filter(z => {
                                return z.indexOf('I') > 1;
                            })
                            .forEach(data => {

                                console.log(`KEYFRAME: ${data}`);
                                
                                const isThisTheFirstFrame = firstFrame;
                                framesIdentified += 1;
        
                                if(firstFrame === true){
                                    firstFrame = false;
                                }
        
                                const frameTime = data.split(',')[0];
                                // ffmpeg -ss 01:23:45 -i input -vframes 1 -q:v 2 output.jpg
        
                                const outputFilename = `${uuid()}.jpg`;
                                const completeOutputFilepath = `${outputPath}/${outputFilename}`;
        
                                const keyFrameExtractionArguments = [
                                    '-ss',
                                    frameTime,
                                    '-i',
                                    filePath,
                                    '-vframes',
                                    '1',
                                    '-q:v',
                                    '2',
                                    completeOutputFilepath
                                ];
        
                                // console.log('FG:', framesGenerated += 1, 'FT:', frameTime);
        
                                const frameExtract = spawnProcess(ffmpeg.path, keyFrameExtractionArguments);
        
                                frameExtract.on(`close`, (code) => {
                                    
                                    if(code === 1){
                                        console.log(`frameExtract exited with status code 1 and was unhappy`);
                                    } else if(code === 0){
                                        console.log(`frameExtract closed and was happy`);
                                        
                                        framesGenerated += 1;
                                        console.log('FG:', framesGenerated, 'FI:', framesIdentified, 'FT:', frameTime);
        
                                        const d = {
                                            keyframeTimeoffset : Number(frameTime),
                                            payload : fs.readFileSync( completeOutputFilepath ),
                                            firstFrame : isThisTheFirstFrame,
                                            analysisUUID : jobUUID
                                        };
        
                                        console.log('>>>', d.keyframeTimeoffset);
                                
                                        d.res = msg.res;
                
                                        node.send(d);
        
                                        if(finishedLooking === true && framesIdentified === framesGenerated){
                                            msg.finished = true;
                                            msg.analysisUUID = jobUUID;
                                            msg.totalFrames = framesGenerated;
                                            
                                            node.send(msg);

                                            fs.rmdir(outputPath, (err) => {
                                                if(err){
                                                    console.log(`There was an error unlinking '${outputPath}'`, err);
                                                }
                                            });

                                        }
        
                                    }
                        
                                });

                            })
                        ;


                    }
                });
        
                keyframeTimeIndexExtraction.stderr.on(`data`, (data) => {
                    console.log(`stderr: ${data}`);
                });
        
                keyframeTimeIndexExtraction.on(`close`, (code) => {
        
                    if(code === 1){
                        console.log(`keyframeTimeIndexExtraction exited with status code 1 and was unhappy`);
                    } else if(code === 0){
                        console.log(`keyframeTimeIndexExtraction closed and was happy`);

                        finishedLooking = true;

                    }
        
                });

            });

        });

    }

    RED.nodes.registerType("extract-keyframes", extractKeyframes);

}