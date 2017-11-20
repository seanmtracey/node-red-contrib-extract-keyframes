# node-red-contrib-extract-keyframes
A Node-red module for creating flows that extract keyframes from videos.


## Inputs

A `filePath` to a video file must be passed for processing.

```
{
    payload : {
        filePath : "/path/to/validFile.mp4"
    }
}
```

## Outputs

Once the extraction process has begun, one of two object will be emitted by the node.

For every keyframe extracted from the chosen video file, the following object will output. 

```
{
    keyframeTimeoffset : <Number>, // The time index of the extracted frame.
    payload : <Buffer>, // A buffer of the extracted image.
    firstFrame : <Boolean>, // True if this is the first frame extracted. Otherwise, false.
    res : <Object>, // If the object passed to the node had a res object, it will be cloned and included as part of the response.
    analysisUUID : <String> // A UUID identifying identifying the instance of keyframe extraction that this object belongs to.
}
```

If every keyframe has been identified and extracted from the passed video the original object passed to node will be passed as an output with the following additional properties added.

```
{
    finished : true, // Only ever true. Only ever included on the final message output by the node
    analysisUUID : <String>, A UUID identifying identifying the instance of keyframe extraction that this object belongs to.
    totalFrames : <Number> // The total number of keyframes identified by the node.
}
```

For further information on when this object is passed, see Addendum 1.

## Addendum

### 1: The 'finished' object

The finished object (the object that includes finished : true) is fired when the last keyframe has been identified by the node.

This does not necessarrily mean that every keyframe has been extracted from the video file and corresponding `keyframe` event has been triggered. These processes happen independently of one another, and are not guarenteed to complete at the same time. 

To check that all of the keyframes have been identified _and_ have been returned, you must check that the number of `keyframe` events that have been emitted match the `totalFrames` property of the object passed to the `finish` event listener