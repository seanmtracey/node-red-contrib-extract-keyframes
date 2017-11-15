const debug = require('debug')('node-red:extract-keyframes');
const extractKeyframes = require('extract-keyframes');

module.exports = function(RED) {

    function nodeRedExtractKeyframes(config) {
        RED.nodes.createNode(this,config);
        const node = this;

        this.on('input', (msg) => {

            extractKeyframes(msg.payload.filePath)
                .then(extractionProcess => {

                    let firstFrame = true;

                    extractionProcess.on('start', function(){
                        debug('Started');
                    }, false);

                    extractionProcess.on('keyframe', function(data){
                        debug('KEYFRAME:', data);

                        const dataToSend = {
                            keyframeTimeoffset : data.keyframeTimeoffset,
                            payload : data.image,
                            firstFrame : firstFrame,
                            analysisUUID : data.analysisUUID
                        };

                        if(firstFrame){
                            firstFrame = false;
                        }

                        dataToSend.res = msg.res;
                        node.send(dataToSend);

                    });

                    extractionProcess.on('finish', function(data){
                        debug('Finish:', data);
                        msg.finished = true;
                        msg.analysisUUID = data.analysisUUID;
                        msg.totalFrames = data.totalFrames;

                        node.send(msg);
                    });

                })
                .catch(err => {
                    debug('Error extracting keyframes:', err);
                })

        });

    }

    RED.nodes.registerType("extract-keyframes", nodeRedExtractKeyframes);

}