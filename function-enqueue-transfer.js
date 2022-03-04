exports.handler = async function(context, event, callback) {

    //set up Twilio variables
    const response = new Twilio.Response();
    const client = context.getTwilioClient();
    const twiml = new Twilio.twiml.VoiceResponse();

    //set default response status to 200
    response.setStatusCode(200);

    //get variables from context
    const EveryoneQueue = context.EVERYONE_QUEUE_NAME,  //"Everyone"
          SpanishQueue = context.SPANISH_QUEUE_NAME,    //"Spanish"
          EnglishQueue = context.ENGLISH_QUEUE_NAME     //"English"

    const EveryoneWorkflowSid = context.EVERYONE_WORKFLOW_SID,
          SpanishWorkflowSid = context.SPANISH_WORKFLOW_SID,
          EnglishWorkflowSid = context.ENGLISH_WORKFLOW_SID

    //map the taskqueue to its corresponding workflow
    const workflows = {
        [EveryoneQueue]: EveryoneWorkflowSid,
        [SpanishQueue]: SpanishWorkflowSid,
        [EnglishQueue]: EnglishWorkflowSid
    };

    //only target COLD transfer voice tasks
    if (event.EventType === 'task.transfer-initiated' && event.TaskChannelUniqueName === 'voice' && event.TransferMode === 'COLD') {
        //get data from the taskrouter event
        const taskAttributes = JSON.parse(event.TaskAttributes);
        const direction = taskAttributes.direction;
        const taskSid = event.TaskSid;
        const taskQueueName = event.TaskQueueName;

        //get call sid from task attributes based on direction
        let callSid = direction === "outbound" ? taskAttributes.conference.participants.customer : taskAttributes.call_sid

        //set transfer (new task) attributes for logging
        const transferAttributes = JSON.stringify({
            originalTask: taskSid,
            isTransfer: true,
            transferredAt: Date.now(),
            conversation: {
                conversation_id: taskSid
            }
        });
        console.log(`New transferred task's attributes: ${transferAttributes}`);

        //choose workflow to transfer to based on selected transfer taskqueue
        const workflowSid = workflows[taskQueueName];
        console.log(`TaskQueue ${taskQueueName} matched with Workflow: ${workflowSid}`);

        //set up twiml to use on the Call update
        twiml
            .enqueue({
                workflowSid: workflowSid,
            })
            .task({
                priority: '150' //optional - higher priority for transfers
            }, transferAttributes)

        console.log(`Transferring customer call ${callSid} with new TwiML ${twiml.toString()}`);

        //update the call resource to the new twiml
        try {
            await client.calls(callSid).update({ twiml: twiml.toString() })
                      .then(()=> {
                        console.log(`Transfer success.`);
                        return callback(null, response);
                      })
        }
        catch(error){
            console.log(`ERROR with ${taskSid}: ${error.message}`);
            response.setStatusCode(500); //update error status
            return callback(null, response);
        }
    }
    else {
        return callback(null, response);
    }
}
