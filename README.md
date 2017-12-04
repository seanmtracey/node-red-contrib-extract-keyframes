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
    payload : {
        image : <Buffer>, // A buffer of the extracted image.
        timeOffset : <Number> // The time index of the extracted frame.
    },
    parts : {
        id : <String>, // A UUID identifying identifying the instance of keyframe
        type : "object",
        index : <Number> // How many frames have been emitted before this one.
    }
    res : <Object>, // If the object passed to the node had a res object (from a HTTP request), it will be cloned and included as part of the response.
}
```

If every keyframe has been identified and extracted from the passed video the original object passed to node will be passed as an output with the following additional properties added.

```
{
    complete : true, // Only ever true. Only ever included on the final message output by the node
    parts : {
        id : <String>, A UUID identifying identifying the instance of keyframe extraction that this object belongs to.
        type : "object",
        count : <Number> // The total number of keyframes identified by the node.
    }
}
```