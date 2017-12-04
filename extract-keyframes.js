const debug = require('debug')('node-red:extract-keyframes');
const uuid = require('uuid/v4');
const extractKeyframes = require('extract-keyframes');

module.exports = function(RED) {

    function nodeRedExtractKeyframes(config) {
        RED.nodes.createNode(this,config);
        const node = this;

        this.on('input', (msg) => {

            extractKeyframes(msg.payload.filePath)
                .then(extractionProcess => {

                    const jobUUID = uuid();
                    let firstFrame = true;
                    let frameIndex = -1;
                    const extractedFrames = [];

                    extractionProcess.on('start', function(){
                        debug('Keyframe Extraction Started');
                    }, false);

                    extractionProcess.on('keyframe', function(data){
                        debug('KEYFRAME:', data);
                        frameIndex += 1;

                        node.send({
                            payload : {
                                image : data.image,
                                timeOffset : data.keyframeTimeoffset
                            },
                            parts : {
                                id : jobUUID,
                                type : "object",
                                index : frameIndex
                            },
                            res : msg.res
                        });

                    });

                    extractionProcess.on('finish', function(data){
                        debug('Finish:', data);
                        
                        node.send({
                            parts : {
                                type : "object",
                                id : msg.analysisUUID,
                                count : data.totalFrames
                            },
                            complete : true
                        });

                    });

                })
                .catch(err => {
                    debug('Error extracting keyframes:', err);
                })
            ;

        });

    }

    RED.nodes.registerType("extract-keyframes", nodeRedExtractKeyframes);

}