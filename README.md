# Re-route Transferred Tasks through Workflow
Twilio Flex solution to allow transferred Voice Tasks to re-route through a TaskRouter Workflow. 

## Overview

### Why was this created?
By default, Flex will **NOT** route transferred Tasks through a Workflow. When a Task is transferred, it will route directly to the AGENT or QUEUE selected in the WorkerDirectory component. No further routing logic will be applied. 
![image](https://user-images.githubusercontent.com/67924770/157151805-3db3402d-5360-4f1c-9b8c-8e4be789cc23.png)

This becomes a concern when a Queue has no available agents and will not have any available agents for the foreseeable future, like a department that closes for the weekends. A caller transferred to a Queue with no available agents will wait on the line until an agent becomes available or until it reaches the Twilio Voice limit of 24 hours.

This solution will solve this problem by sending COLD-transferred Tasks through a Workflow to allow for routing logic to be applied again.

### How does this work?
A Twilio Serverless Function is set as the [TaskRouter Workspace Event Callback URL](https://www.twilio.com/docs/taskrouter/api/workflow) so it can consume events from TaskRouter in real-time. 

From this Function, we listen for a COLD `task.transfer-initiated` event to a `QUEUE`, indicating a Task has been transferred that should be re-routed to a Workflow (Task A). 

When received, we capture the “customer” Call SID and `<Enqueue>` it [to a specified TaskRouter Workflow](https://www.twilio.com/docs/taskrouter/twiml-queue-calls#using-enqueue-to-route-calls-with-taskrouter). 

This will treat the "transfer" as a *new inbound call* and create a second Task (Task B). Task B will then route through the Workflow as any standard inbound call would.

This solution will also set a Task Attribute on the transferred Task (Task B) to connect both Tasks together [in Flex Insights reporting as one Conversation](https://www.twilio.com/docs/flex/developer/insights/enhance-integration#:~:text=To%20link%20tasks,to%20the%20Conversation.). 

## Setup Requirements

### Environment Variables
1. Create Environment Variables for each of your TaskQueues.   
    For example:   
        > EVERYONE_QUEUE_NAME = “Everyone”  

2. Create Environment Variables for each of your Workflows involved with Transfers.    
    For example:    
        > EVERYONE_WORKFLOW_SID = “WWxxxxxxxxxx”   
        
3. Determine which Workflow should be selected for each of the Task Queues available for transferring.
    For example, if we had 3 queues, they would each need to be mapped to a Workflow.     
        > Everyone Queue -> Everyone Workflow   
        > Spanish Queue -> Spanish Workflow   
        > English Queue -> English Workflow   

### Deploy Function

Follow steps in this documentation to build and deploy your Serverless Function:
https://www.twilio.com/docs/runtime/functions

### TaskRouter Workspace Event Callback URL
Set the URL generated from deploying the Function in the previous step as the [TaskRouter Workspace Event Callback URL](https://www.twilio.com/docs/taskrouter/api/workflow), so it can consume events from TaskRouter in real-time. 

## Disclaimer
This software is to be considered "sample code", a Type B Deliverable, and is delivered "as-is" to the user. Twilio bears no responsibility to support the use or implementation of this software.
